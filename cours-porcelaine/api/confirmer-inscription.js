'use strict';

/**
 * Endpoint PUBLIC (GET) : appelé automatiquement par public/merci.html
 * quand la cliente revient de SumUp après un paiement réussi (via le
 * paramètre ?ref= présent dans redirect_url, voir api/create-checkout.js).
 *
 * C'est ce moment-là — pas la création du paiement — qui déclenche les
 * e-mails de confirmation (cliente) et de notification (administratrice),
 * pour ne jamais envoyer un e-mail "Inscription confirmée" à une cliente
 * qui aurait abandonné son paiement en cours de route.
 *
 * Idempotent : si les e-mails ont déjà été envoyés pour cette inscription,
 * ou si la référence est inconnue, l'endpoint ne fait rien et répond quand
 * même 200 (un rechargement de la page "Merci" ne renvoie donc pas les
 * e-mails en double).
 */

const { getRegistrationByReference, marquerEmailEnvoye } = require('./_registrations');
const { getCourse } = require('./_store');
const { envoyerEmail } = require('./_email');

function echapperHtml(texte) {
  return String(texte).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formaterDateFr(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  const ref = req.query && req.query.ref;
  if (!ref) {
    res.status(200).json({ ok: true });
    return;
  }

  const registration = getRegistrationByReference(ref);
  if (!registration || registration.emailEnvoye) {
    res.status(200).json({ ok: true });
    return;
  }

  const course = getCourse(registration.courseId);

  if (course) {
    const dateFormatee = formaterDateFr(course.date);
    const detailsCours = `${echapperHtml(course.titre)}<br/>${echapperHtml(dateFormatee)} à ${echapperHtml(course.heure)}${course.duree ? ' · ' + echapperHtml(course.duree) : ''}<br/>${echapperHtml(course.lieu)}<br/>${echapperHtml(String(course.prix))} €`;

    await Promise.all([
      envoyerEmail({
        to: registration.email,
        subject: `Inscription confirmée : ${course.titre}`,
        html: `<p>Bonjour ${echapperHtml(registration.prenom)},</p><p>Votre inscription est bien confirmée pour :</p><p><strong>${detailsCours}</strong></p><p>À bientôt !</p>`,
      }),
      process.env.ADMIN_EMAIL
        ? envoyerEmail({
            to: process.env.ADMIN_EMAIL,
            subject: `Nouvelle inscription payée : ${registration.prenom} ${registration.nom} — ${course.titre}`,
            html: `<p>Nouvelle inscription confirmée :</p><p><strong>Cliente :</strong> ${echapperHtml(registration.prenom)} ${echapperHtml(registration.nom)} (${echapperHtml(registration.email)})</p><p><strong>Cours :</strong><br/>${detailsCours}</p>`,
          })
        : null,
    ]);
  }

  marquerEmailEnvoye(registration.id);

  res.status(200).json({ ok: true });
};
