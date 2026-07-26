'use strict';

/**
 * Stockage des cours.
 *
 * Sur Vercel, le système de fichiers est en lecture seule en production,
 * sauf le dossier /tmp qui est accessible en écriture — mais /tmp N'EST PAS
 * persistant entre deux "cold starts" et n'est PAS partagé entre plusieurs
 * instances de la fonction. C'est suffisant pour tester et pour un usage
 * avec un faible trafic, mais pas pour un usage durable en production.
 *
 * Fonctionnement ici : on lit les données de départ depuis
 * data/courses.seed.json (versionné dans le repo) et on écrit toutes les
 * modifications (création, modification, suppression, inscriptions) dans
 * /tmp/courses.json.
 *
 * POUR PASSER À UN VRAI STOCKAGE PERSISTANT (recommandé dès que le site est
 * utilisé sérieusement) : brancher Vercel KV, Upstash Redis ou Supabase en
 * réécrivant uniquement les fonctions ci-dessous, avec exactement les mêmes
 * noms et la même signature : listCourses, getCourse, createCourse,
 * updateCourse, deleteCourse, incrementInscrits, estComplet. Aucun autre
 * fichier du projet (api/courses.js, api/admin-courses.js, etc.) n'a besoin
 * d'être modifié.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SEED_PATH = path.join(__dirname, '..', 'data', 'courses.seed.json');
const RUNTIME_PATH = path.join('/tmp', 'courses.json');

function ensureRuntimeFile() {
  if (!fs.existsSync(RUNTIME_PATH)) {
    const seed = fs.readFileSync(SEED_PATH, 'utf8');
    fs.writeFileSync(RUNTIME_PATH, seed);
  }
}

function readAll() {
  ensureRuntimeFile();
  const raw = fs.readFileSync(RUNTIME_PATH, 'utf8');
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function writeAll(courses) {
  fs.writeFileSync(RUNTIME_PATH, JSON.stringify(courses, null, 2));
}

function estComplet(course) {
  return course.inscrits >= course.places;
}

function listCourses() {
  return readAll();
}

function getCourse(id) {
  return readAll().find((c) => c.id === id) || null;
}

function createCourse(data) {
  const courses = readAll();
  const course = {
    id: crypto.randomUUID(),
    titre: data.titre,
    niveau: data.niveau,
    prix: Number(data.prix),
    date: data.date,
    heure: data.heure,
    lieu: data.lieu,
    places: Number(data.places),
    inscrits: 0,
  };
  courses.push(course);
  writeAll(courses);
  return course;
}

function updateCourse(id, data) {
  const courses = readAll();
  const index = courses.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const existing = courses[index];
  const updated = {
    ...existing,
    titre: data.titre !== undefined ? data.titre : existing.titre,
    niveau: data.niveau !== undefined ? data.niveau : existing.niveau,
    prix: data.prix !== undefined ? Number(data.prix) : existing.prix,
    date: data.date !== undefined ? data.date : existing.date,
    heure: data.heure !== undefined ? data.heure : existing.heure,
    lieu: data.lieu !== undefined ? data.lieu : existing.lieu,
    places: data.places !== undefined ? Number(data.places) : existing.places,
    inscrits: data.inscrits !== undefined ? Number(data.inscrits) : existing.inscrits,
  };
  courses[index] = updated;
  writeAll(courses);
  return updated;
}

function deleteCourse(id) {
  const courses = readAll();
  const index = courses.findIndex((c) => c.id === id);
  if (index === -1) return false;
  courses.splice(index, 1);
  writeAll(courses);
  return true;
}

function incrementInscrits(id) {
  const courses = readAll();
  const index = courses.findIndex((c) => c.id === id);
  if (index === -1) return null;
  courses[index].inscrits += 1;
  writeAll(courses);
  return courses[index];
}

module.exports = {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  incrementInscrits,
  estComplet,
};
