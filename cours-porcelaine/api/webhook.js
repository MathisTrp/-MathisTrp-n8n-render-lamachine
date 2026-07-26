'use strict';

/**
 * Squelette du webhook SumUp — PAS ENCORE ACTIF.
 *
 * SumUp peut notifier cette URL à chaque changement de statut d'un
 * checkout (payé, échoué...). Pour l'instant, ce endpoint se contente de
 * journaliser l'événement reçu et de répondre 200 (obligatoire pour que
 * SumUp continue à envoyer les événements).
 *
 * ÉTAPES POUR L'ACTIVER PLUS TARD :
 *
 * 1. Dans le dashboard SumUp (ou via l'API SumUp), configurer l'URL de
 *    webhook vers "https://<votre-domaine>/api/webhook".
 *
 * 2. Ne jamais faire confiance au contenu du webhook seul (il peut être
 *    falsifié). À la réception d'un événement, rappeler l'API SumUp pour
 *    vérifier le statut réel du checkout :
 *      GET https://api.sumup.com/v0.1/checkouts/{id}
 *      Authorization: Bearer <SUMUP_API_KEY>
 *    et vérifier que "status" vaut bien "PAID".
 *
 * 3. Extraire le courseId depuis "checkout_reference", qui a le format
 *    "cours_<courseId>_<timestamp>" (voir api/create-checkout.js).
 *
 * 4. Si le paiement est confirmé, appeler incrementInscrits(courseId)
 *    (exporté par ./_store) pour marquer une place comme prise. Prévoir
 *    une protection anti-double-comptage (par exemple en gardant la liste
 *    des checkout_reference déjà traités, pour ignorer les notifications
 *    envoyées plusieurs fois par SumUp).
 *
 * 5. Envoyer un POST vers process.env.N8N_WEBHOOK_URL avec les infos utiles
 *    (cours, cliente, montant) pour déclencher une automatisation n8n —
 *    par exemple un e-mail de confirmation ou un ajout à un tableau de
 *    suivi.
 *
 * Exemple de squelette une fois activé :
 *
 *   const { incrementInscrits } = require('./_store');
 *
 *   const checkoutId = body.id; // selon le format exact envoyé par SumUp
 *   const verifRes = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
 *     headers: { Authorization: `Bearer ${process.env.SUMUP_API_KEY}` },
 *   });
 *   const checkout = await verifRes.json();
 *
 *   if (checkout.status === 'PAID') {
 *     const [, courseId] = checkout.checkout_reference.match(/^cours_(.+)_\d+$/) || [];
 *     if (courseId) incrementInscrits(courseId);
 *
 *     if (process.env.N8N_WEBHOOK_URL) {
 *       await fetch(process.env.N8N_WEBHOOK_URL, {
 *         method: 'POST',
 *         headers: { 'Content-Type': 'application/json' },
 *         body: JSON.stringify({ checkout, courseId }),
 *       });
 *     }
 *   }
 */

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }

  console.log('Webhook SumUp reçu :', JSON.stringify(body));

  res.status(200).json({ received: true });
};
