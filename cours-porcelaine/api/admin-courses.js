'use strict';

/**
 * Endpoint ADMIN (GET / POST / PUT / DELETE) : gestion complète des cours.
 * Protégé par mot de passe (en-tête "x-admin-password"), vérifié par
 * checkAdmin() dans ./_auth.
 *
 * Contrairement à l'endpoint public, la vue ici inclut le nombre de places,
 * le nombre d'inscrits et les places restantes.
 */

const { checkAdmin } = require('./_auth');
const {
  listCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('./_store');

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

function toAdminView(course) {
  return {
    id: course.id,
    titre: course.titre,
    niveau: course.niveau,
    prix: course.prix,
    date: course.date,
    heure: course.heure,
    lieu: course.lieu,
    places: course.places,
    inscrits: course.inscrits,
    placesRestantes: Math.max(course.places - course.inscrits, 0),
    complet: course.inscrits >= course.places,
  };
}

function toDateTime(course) {
  return new Date(`${course.date}T${course.heure || '00:00'}`);
}

module.exports = async (req, res) => {
  if (!checkAdmin(req)) {
    res.status(401).json({ error: 'Mot de passe administrateur invalide.' });
    return;
  }

  if (req.method === 'GET') {
    const courses = listCourses()
      .sort((a, b) => toDateTime(a) - toDateTime(b))
      .map(toAdminView);
    res.status(200).json(courses);
    return;
  }

  if (req.method === 'POST') {
    let body;
    try {
      body = await readJsonBody(req);
    } catch (e) {
      res.status(400).json({ error: 'Requête invalide.' });
      return;
    }

    const { titre, niveau, prix, date, heure, lieu, places } = body || {};
    if (!titre || !niveau || !prix || !date || !heure || !lieu || !places) {
      res.status(400).json({ error: 'Merci de remplir tous les champs.' });
      return;
    }

    const course = createCourse({ titre, niveau, prix, date, heure, lieu, places });
    res.status(201).json(toAdminView(course));
    return;
  }

  if (req.method === 'PUT') {
    let body;
    try {
      body = await readJsonBody(req);
    } catch (e) {
      res.status(400).json({ error: 'Requête invalide.' });
      return;
    }

    const { id, ...rest } = body || {};
    if (!id) {
      res.status(400).json({ error: 'Identifiant du cours manquant.' });
      return;
    }

    const updated = updateCourse(id, rest);
    if (!updated) {
      res.status(404).json({ error: "Ce cours n'existe pas." });
      return;
    }

    res.status(200).json(toAdminView(updated));
    return;
  }

  if (req.method === 'DELETE') {
    let id = req.query && req.query.id;

    if (!id) {
      try {
        const body = await readJsonBody(req);
        id = body && body.id;
      } catch (e) {
        // pas de corps JSON, on continue avec id vide
      }
    }

    if (!id) {
      res.status(400).json({ error: 'Identifiant du cours manquant.' });
      return;
    }

    const deleted = deleteCourse(id);
    if (!deleted) {
      res.status(404).json({ error: "Ce cours n'existe pas." });
      return;
    }

    res.status(204).end();
    return;
  }

  res.status(405).json({ error: 'Méthode non autorisée' });
};
