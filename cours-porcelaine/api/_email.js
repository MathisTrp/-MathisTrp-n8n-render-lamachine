'use strict';

/**
 * Envoi d'e-mails via l'API Resend (https://resend.com).
 *
 * Si RESEND_API_KEY ou EMAIL_FROM ne sont pas configurées, l'envoi est
 * simplement ignoré (avec un message dans les logs) — tant que ce n'est
 * pas mis en place, ça ne bloque jamais une inscription ou un paiement.
 */

async function envoyerEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.log("Resend non configuré (RESEND_API_KEY / EMAIL_FROM manquant) : e-mail non envoyé —", subject);
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error('Erreur Resend:', res.status, detail);
    }
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'e-mail:", error);
  }
}

module.exports = { envoyerEmail };
