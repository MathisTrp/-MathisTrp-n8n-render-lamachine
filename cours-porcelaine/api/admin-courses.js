'use strict';

/**
 * Endpoint ADMIN (GET / POST / PUT / DELETE) : gestion complète des cours.
 * Protégé par mot de passe (en-tête "x-admin-password"), vérifié par
 * checkAdmin() dans ./_auth.
 *
 * Contrairement à l'endpoint public, la vue ici inclut le nombre de places,
 * le nombre d'inscrits et les places restantes.
 *
 * POST accepte en plus deux champs optionnels pour créer plusieurs séances
 * d'un coup ("récurrence") : "recurrence" ("aucune" | "hebdomadaire" |
 * "quinzomadaire") et "nombreSeances" (nombre de séances à générer, la
 * première étant à la date fournie). Chaque séance créée est un cours
 * indépendant (avec ses propres places/inscrits), reliées entre elles par
 * un "recurrenceId" commun — ce qui permet de les supprimer toutes en une
 * fois via DELETE ?recurrenceId=...
 */

const crypto = require('crypto');
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
    type: course.type || 'cours',
    niveau: course.niveau,
    prix: course.prix,
    date: course.date,
    heure: course.heure,
    duree: course.duree,
    lieu: course.lieu,
    places: course.places,
    inscrits: course.inscrits,
    placesRestantes: Math.max(course.places - course.inscrits, 0),
    complet: course.inscrits >= course.places,
    recurrenceId: course.recurrenceId || null,
  };
}

function toDateTime(course) {
  return new Date(`${course.date}T${course.heure || '00:00'}`);
}

function ajouterJours(dateStr, jours) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + jours);
  return d.toISOString().slice(0, 10);
}

const PAS_RECURRENCE = {
  hebdomadaire: 7,
  quinzomadaire: 14,
};

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

    const { titre, type, niveau, prix, date, heure, duree, lieu, places, recurrence, nombreSeances } = body || {};
    if (!titre || !niveau || !prix || !date || !heure || !duree || !lieu || !places) {
      res.status(400).json({ error: 'Merci de remplir tous les champs.' });
      return;
    }

    const champsCommuns = { titre, type: type || 'cours', niveau, prix, heure, duree, lieu, places };
    const pas = PAS_RECURRENCE[recurrence];

    if (!pas) {
      const course = createCourse({ ...champsCommuns, date });
      res.status(201).json(toAdminView(course));
      return;
    }

    const total = Math.min(Math.max(Number(nombreSeances) || 1, 2), 52);
    const recurrenceId = crypto.randomUUID();
    const coursCrees = [];
    for (let i = 0; i < total; i += 1) {
      coursCrees.push(createCourse({ ...champsCommuns, date: ajouterJours(date, i * pas), recurrenceId }));
    }

    res.status(201).json({ series: true, count: coursCrees.length, courses: coursCrees.map(toAdminView) });
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
    let recurrenceId = req.query && req.query.recurrenceId;

    if (!id && !recurrenceId) {
      try {
        const body = await readJsonBody(req);
        id = body && body.id;
        recurrenceId = body && body.recurrenceId;
      } catch (e) {
        // pas de corps JSON, on continue avec les valeurs vides
      }
    }

    if (recurrenceId) {
      const aSupprimer = listCourses().filter((c) => c.recurrenceId === recurrenceId);
      aSupprimer.forEach((c) => deleteCourse(c.id));
      res.status(204).end();
      return;
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
