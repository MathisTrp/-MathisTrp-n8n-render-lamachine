'use strict';

/**
 * Endpoint PUBLIC (POST) : crée un paiement SumUp (Hosted Checkout) pour un
 * cours donné.
 *
 * Sécurité :
 * - Le prix payé est TOUJOURS celui enregistré côté serveur pour ce cours
 *   (jamais un montant envoyé par le navigateur).
 * - La clé API SumUp (SUMUP_API_KEY) n'est utilisée que côté serveur.
 * - Le cours est refusé si complet.
 *
 * Doc SumUp Hosted Checkout : POST https://api.sumup.com/v0.1/checkouts
 * Champs : amount, currency, checkout_reference, description, merchant_code,
 * redirect_url, hosted_checkout: { enabled: true }.
 * Auth : en-tête "Authorization: Bearer <SUMUP_API_KEY>".
 * La réponse contient "hosted_checkout_url", l'URL de paiement à afficher.
 */

const { getCourse, estComplet, incrementInscrits } = require('./_store');
const { createRegistration } = require('./_registrations');

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body !== undefined) {
      if (typeof req.body === 'string') {
        try {
          resolve(req.body ? JSON.parse(req.body) : {});
        } catch (e) {
          reject(e);
        }
      } else {
        resolve(req.body || {});
      }
      return;
    }
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (e) {
    res.status(400).json({ error: 'Requête invalide.' });
    return;
  }

  const { courseId, prenom, nom, email } = body || {};

  if (!courseId || !prenom || !nom || !email) {
    res.status(400).json({ error: 'Merci de renseigner tous les champs.' });
    return;
  }

  const course = getCourse(courseId);
  if (!course) {
    res.status(404).json({ error: "Ce cours n'existe pas ou plus." });
    return;
  }

  if (estComplet(course)) {
    res.status(409).json({ error: 'Ce cours est complet.' });
    return;
  }

  const apiKey = process.env.SUMUP_API_KEY;
  const merchantCode = process.env.SUMUP_MERCHANT_CODE;

  if (!apiKey || !merchantCode) {
    console.error('Configuration SumUp manquante (SUMUP_API_KEY / SUMUP_MERCHANT_CODE).');
    res.status(500).json({ error: 'Le paiement est momentanément indisponible. Merci de réessayer plus tard.' });
    return;
  }

  const baseUrl = process.env.PUBLIC_BASE_URL || `https://${req.headers.host}`;
  const checkoutReference = `cours_${course.id}_${Date.now()}`;

  try {
    const sumupResponse = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        amount: course.prix,
        currency: 'EUR',
        checkout_reference: checkoutReference,
        description: `${course.titre} — ${prenom} ${nom}`,
        merchant_code: merchantCode,
        redirect_url: `${baseUrl}/merci.html?ref=${encodeURIComponent(checkoutReference)}`,
        hosted_checkout: { enabled: true },
      }),
    });

    const sumupData = await sumupResponse.json();

    if (!sumupResponse.ok || !sumupData.hosted_checkout_url) {
      console.error('Erreur SumUp:', sumupResponse.status, sumupData);
      res.status(502).json({ error: "Le paiement n'a pas pu être initié. Merci de réessayer." });
      return;
    }

    // Enregistre la cliente dès que le paiement est initié, pour que
    // l'administratrice voie qui s'est inscrite et que la place soit
    // réservée pendant qu'elle paie. Tant que le webhook SumUp
    // (api/webhook.js) n'est pas activé, ceci ne confirme pas que le
    // paiement a réellement abouti — l'administratrice peut annuler une
    // inscription depuis l'admin si besoin (ex : paiement abandonné).
    //
    // Les e-mails de confirmation, eux, ne partent PAS ici : ils ne sont
    // envoyés que lorsque la cliente revient réellement sur la page
    // "Merci" après un paiement SumUp réussi (voir merci.html et
    // api/confirmer-inscription.js), pour ne jamais annoncer une
    // inscription "confirmée" à quelqu'un qui aurait abandonné le paiement.
    createRegistration({
      courseId: course.id,
      prenom,
      nom,
      email,
      montant: course.prix,
      checkoutReference,
    });
    incrementInscrits(course.id);

    res.status(200).json({ checkoutUrl: sumupData.hosted_checkout_url });
  } catch (error) {
    console.error('Erreur lors de la création du checkout SumUp:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création du paiement.' });
  }
};
