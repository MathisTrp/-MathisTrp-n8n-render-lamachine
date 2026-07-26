'use strict';

/**
 * Stockage des inscriptions (coordonnées de la cliente, cours, statut).
 *
 * Même fonctionnement que _store.js : les données de départ viennent de
 * data/registrations.seed.json (versionné) et les écritures se font dans
 * /tmp/registrations.json. Voir _store.js pour les limites de ce stockage
 * en production et comment le remplacer par une vraie base de données —
 * la même remarque s'applique ici, en gardant les mêmes fonctions
 * exportées : listRegistrations, createRegistration, setStatutRegistration.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SEED_PATH = path.join(__dirname, '..', 'data', 'registrations.seed.json');
const RUNTIME_PATH = path.join('/tmp', 'registrations.json');

function ensureRuntimeFile() {
  if (!fs.existsSync(RUNTIME_PATH)) {
    const seed = fs.existsSync(SEED_PATH) ? fs.readFileSync(SEED_PATH, 'utf8') : '[]';
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

function writeAll(registrations) {
  fs.writeFileSync(RUNTIME_PATH, JSON.stringify(registrations, null, 2));
}

function listRegistrations() {
  return readAll();
}

function createRegistration(data) {
  const registrations = readAll();
  const registration = {
    id: crypto.randomUUID(),
    courseId: data.courseId,
    prenom: data.prenom,
    nom: data.nom,
    email: data.email,
    montant: data.montant,
    checkoutReference: data.checkoutReference,
    statut: 'inscrite',
    creeLe: new Date().toISOString(),
  };
  registrations.push(registration);
  writeAll(registrations);
  return registration;
}

function setStatutRegistration(id, statut) {
  const registrations = readAll();
  const index = registrations.findIndex((r) => r.id === id);
  if (index === -1) return null;
  registrations[index].statut = statut;
  writeAll(registrations);
  return registrations[index];
}

module.exports = {
  listRegistrations,
  createRegistration,
  setStatutRegistration,
};
