'use strict';

/**
 * Endpoint ADMIN (GET / PATCH) : liste des inscriptions (nom, e-mail,
 * cours, statut) et gestion de leur statut. Protégé par mot de passe,
 * comme api/admin-courses.js.
 *
 * PATCH permet d'annuler une inscription (libère une place sur le cours)
 * ou de la réactiver (reprend une place).
 */

const { checkAdmin } = require('./_auth');
const { listRegistrations, setStatutRegistration } = require('./_registrations');
const { listCourses, incrementInscrits } = require('./_store');

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
}

const STATUTS_VALIDES = ['inscrite', 'annulee'];

module.exports = async (req, res) => {
  if (!checkAdmin(req)) {
    res.status(401).json({ error: 'Mot de passe administrateur invalide.' });
    return;
  }

  if (req.method === 'GET') {
    const coursById = {};
    listCourses().forEach((course) => {
      coursById[course.id] = course;
    });

    const registrations = listRegistrations()
      .map((r) => {
        const course = coursById[r.courseId];
        return {
          id: r.id,
          courseId: r.courseId,
          coursTitre: course ? course.titre : 'Cours supprimé',
          coursDate: course ? course.date : null,
          coursHeure: course ? course.heure : null,
          prenom: r.prenom,
          nom: r.nom,
          email: r.email,
          montant: r.montant,
          statut: r.statut,
          creeLe: r.creeLe,
        };
      })
      .sort((a, b) => new Date(b.creeLe) - new Date(a.creeLe));

    res.status(200).json(registrations);
    return;
  }

  if (req.method === 'PATCH' || req.method === 'PUT') {
    let body;
    try {
      body = await readJsonBody(req);
    } catch (e) {
      res.status(400).json({ error: 'Requête invalide.' });
      return;
    }

    const { id, statut } = body || {};
    if (!id || !STATUTS_VALIDES.includes(statut)) {
      res.status(400).json({ error: 'Identifiant ou statut invalide.' });
      return;
    }

    const existing = listRegistrations().find((r) => r.id === id);
    if (!existing) {
      res.status(404).json({ error: "Cette inscription n'existe pas." });
      return;
    }

    if (existing.statut !== statut) {
      if (statut === 'annulee') {
        incrementInscrits(existing.courseId, -1);
      } else if (statut === 'inscrite') {
        incrementInscrits(existing.courseId, 1);
      }
    }

    const updated = setStatutRegistration(id, statut);
    res.status(200).json(updated);
    return;
  }

  res.status(405).json({ error: 'Méthode non autorisée' });
};
