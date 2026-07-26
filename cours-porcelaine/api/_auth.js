'use strict';

/**
 * Vérifie que la requête admin porte le bon mot de passe, envoyé dans
 * l'en-tête "x-admin-password". Le mot de passe attendu vient de la
 * variable d'environnement ADMIN_PASSWORD (jamais codé en dur).
 */
function checkAdmin(req) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;

  const provided = req.headers['x-admin-password'];
  return typeof provided === 'string' && provided === expected;
}

module.exports = { checkAdmin };
