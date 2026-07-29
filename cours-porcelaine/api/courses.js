'use strict';

/**
 * Endpoint PUBLIC (GET) : liste des cours ouverts aux inscriptions.
 *
 * Ne renvoie JAMAIS le nombre de places ni le nombre d'inscrits : uniquement
 * un booléen "complet". Les cours déjà passés sont masqués et le résultat
 * est trié par date croissante.
 */

const { listCourses, estComplet } = require('./_store');

function toDateTime(course) {
  return new Date(`${course.date}T${course.heure || '00:00'}`);
}

module.exports = (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  const now = new Date();

  const courses = listCourses()
    .filter((c) => toDateTime(c) >= now)
    .sort((a, b) => toDateTime(a) - toDateTime(b))
    .map((c) => ({
      id: c.id,
      titre: c.titre,
      type: c.type || 'cours',
      niveau: c.niveau,
      prix: c.prix,
      date: c.date,
      dateFin: c.dateFin || c.date,
      heure: c.heure,
      duree: c.duree,
      lieu: c.lieu,
      complet: estComplet(c),
    }));

  res.status(200).json(courses);
};
