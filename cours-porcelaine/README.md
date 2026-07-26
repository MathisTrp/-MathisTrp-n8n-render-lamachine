# Cours de peinture sur porcelaine — inscription en ligne

Petite application web pour permettre aux élèves de s'inscrire à un cours de peinture sur porcelaine et de payer en ligne (via SumUp), et pour gérer les cours depuis une page d'administration protégée par mot de passe.

Trois pages :
- `public/index.html` — la page publique où les élèves choisissent un cours, laissent leurs coordonnées et payent.
- `public/merci.html` — la page de confirmation après paiement.
- `public/admin.html` (accessible sur `/admin`) — la page pour créer, modifier et suivre les cours.

Aucune base de données à installer : les cours sont stockés dans un simple fichier JSON.

---

## 1. Obtenir vos identifiants SumUp

Il vous faut deux informations : une **clé API** et un **code marchand**.

1. Créez un compte sur [sumup.com](https://sumup.com) si ce n'est pas déjà fait, et connectez-vous au [Dashboard SumUp](https://me.sumup.com).
2. Allez dans **Réglages** (Settings) de votre compte : vous y trouverez votre **Merchant code** (parfois appelé "code marchand"). C'est une suite de lettres/chiffres, notez-le : ce sera `SUMUP_MERCHANT_CODE`.
3. Toujours dans les réglages, cherchez la section **API personnelle** / **API keys** / **Developers**. Créez une nouvelle clé API. Copiez-la immédiatement (elle ne sera souvent affichée qu'une seule fois) : ce sera `SUMUP_API_KEY`.
4. Gardez ces deux informations secrètes, ne les partagez jamais et ne les mettez jamais dans un fichier envoyé sur internet (comme GitHub).

## 2. Tester en mode "bac à sable" (sandbox)

SumUp propose un environnement de test où l'argent n'est pas réellement débité :

1. Dans le Dashboard SumUp, cherchez l'option pour créer un **compte de test / sandbox** (parfois listée sous "Developers" ou "Sandbox").
2. Utilisez la clé API et le merchant code de ce compte de test dans votre fichier `.env` local (voir étape suivante) pendant que vous testez.
3. Faites une inscription complète sur le site en local, avec une carte de test fournie par SumUp (les numéros de carte de test sont indiqués dans leur documentation développeur), pour vérifier que tout le parcours fonctionne : choix du cours → formulaire → paiement → page "Merci".
4. Une fois que tout fonctionne, vous remplacerez ces identifiants de test par vos vrais identifiants (production) avant l'ouverture réelle des inscriptions.

## 3. Lancer le site en local sur votre ordinateur

Pré-requis : avoir [Node.js](https://nodejs.org) installé (version 18 ou plus récente).

1. Ouvrez un terminal dans le dossier `cours-porcelaine`.
2. Copiez le fichier d'exemple des variables d'environnement :
   ```
   cp .env.example .env
   ```
3. Ouvrez le fichier `.env` avec un éditeur de texte et remplissez au moins :
   - `SUMUP_API_KEY` (votre clé de test pour commencer)
   - `SUMUP_MERCHANT_CODE`
   - `ADMIN_PASSWORD` (choisissez un mot de passe pour vous, l'administratrice)
4. Lancez le site avec la CLI Vercel (elle simule exactement l'environnement de production) :
   ```
   npx vercel dev
   ```
5. Ouvrez l'adresse indiquée dans le terminal (en général `http://localhost:3000`) dans votre navigateur.
6. Pour accéder à l'administration : allez sur `http://localhost:3000/admin` et entrez le mot de passe que vous avez choisi dans `.env`.

## 4. Déployer le site sur Vercel

1. Créez un compte sur [vercel.com](https://vercel.com) (gratuit) si vous n'en avez pas.
2. Mettez ce projet sur GitHub (ou GitLab/Bitbucket) si ce n'est pas déjà fait.
3. Dans Vercel, cliquez sur **Add New → Project**, puis sélectionnez votre dépôt.
4. Si ce dossier `cours-porcelaine` n'est pas à la racine du dépôt, indiquez-le dans **Root Directory** lors de la configuration du projet.
5. Avant de cliquer sur "Deploy", allez dans **Environment Variables** et ajoutez :
   - `SUMUP_API_KEY` → votre clé API SumUp (production, une fois prête)
   - `SUMUP_MERCHANT_CODE` → votre code marchand
   - `ADMIN_PASSWORD` → le mot de passe de l'administration
   - `PUBLIC_BASE_URL` → l'adresse de votre site une fois en ligne, par exemple `https://cours-de-ma-mere.vercel.app` (vous pouvez la mettre à jour après le premier déploiement, une fois l'adresse connue)
6. Cliquez sur **Deploy**. Après quelques instants, votre site est en ligne à l'adresse fournie par Vercel.
7. Si vous modifiez une variable d'environnement après coup, il faut redéployer le site (bouton "Redeploy" dans l'onglet Deployments) pour qu'elle soit prise en compte.

## 5. Définir / changer le mot de passe administrateur

Le mot de passe de la page `/admin` est entièrement contrôlé par la variable d'environnement `ADMIN_PASSWORD` :

- En local : modifiez la ligne `ADMIN_PASSWORD=...` dans votre fichier `.env`, puis relancez `npx vercel dev`.
- En ligne : dans Vercel, allez dans **Project Settings → Environment Variables**, modifiez `ADMIN_PASSWORD`, puis redéployez le site.

Il n'y a pas de compte utilisateur ni d'inscription : un seul mot de passe protège toute la page d'administration.

## 6. Créer votre premier cours

1. Allez sur `/admin` (par exemple `https://votre-site.vercel.app/admin`).
2. Entrez le mot de passe administrateur.
3. Remplissez le formulaire "Créer un cours" : titre, type (Cours ou Stage), niveau, prix, durée, date, heure, lieu et nombre de places.
4. Si ce cours se répète (par exemple tous les lundis, ou une semaine sur deux), choisissez la **Récurrence** correspondante et indiquez le nombre de séances à créer : chaque séance est créée comme un cours indépendant, avec ses propres places et inscriptions, mais elles restent reliées entre elles pour pouvoir toutes les supprimer d'un coup avec le bouton "Supprimer la série".
5. Cliquez sur "Créer le cours" : il apparaît aussitôt dans la liste et sur le calendrier ci-dessous, et sur la page publique d'inscription si sa date n'est pas encore passée.
6. Vous pouvez à tout moment "Modifier" ou "Supprimer" un cours depuis cette même page, et voir en un coup d'œil le nombre d'inscrits et de places restantes (ces chiffres ne sont jamais visibles côté public — les élèves voient seulement "Ouvert" ou "Complet").

Des cours d'exemple sont déjà présents (`data/courses.seed.json`) pour que vous puissiez tester tout de suite ; vous pouvez les modifier ou les supprimer depuis l'admin dès que vous êtes prête à les remplacer par vos vrais cours.

## 7. Le tableau de bord : inscriptions et statistiques

En haut de la page `/admin`, une section "Vue d'ensemble" affiche en un coup d'œil : le nombre de cours à venir, le nombre d'inscriptions actives, le total des réservations en cours et le taux de remplissage moyen.

Plus bas, la section "Inscriptions" liste chaque cliente inscrite (prénom, nom, e-mail, cours, montant, date d'inscription), avec une recherche et un filtre par statut. Une inscription peut être annulée (par exemple si le paiement n'a pas abouti) ce qui libère automatiquement une place sur le cours ; elle peut aussi être réactivée.

Important : une inscription est enregistrée dès que la cliente clique sur "Réserver et payer" et obtient son lien SumUp — pas seulement une fois le paiement confirmé (voir la section suivante sur le webhook). Si une cliente abandonne son paiement en cours de route, pensez à annuler son inscription depuis l'admin pour libérer la place.

## 8. Les e-mails automatiques (Resend)

Dès qu'une cliente réserve un cours, deux e-mails peuvent partir automatiquement :
- Un e-mail de confirmation à la cliente, avec les détails du cours.
- Un e-mail de notification à l'administratrice, avec le nom et l'e-mail de la cliente.

C'est **optionnel** : tant que les variables ci-dessous ne sont pas renseignées, ces e-mails sont simplement ignorés — le site continue de fonctionner normalement (paiement, inscriptions, etc.).

Pour les activer :

1. Créez un compte sur [resend.com](https://resend.com) (gratuit pour un usage modeste).
2. Dans le dashboard Resend, allez dans **API Keys** et créez une clé : ce sera `RESEND_API_KEY`.
3. Pour l'adresse d'expédition (`EMAIL_FROM`), deux options :
   - **Pour tester rapidement**, utilisez `Cours de porcelaine <onboarding@resend.dev>` — ça fonctionne sans configuration, mais Resend peut limiter les destinataires en mode test (voir leur documentation).
   - **Pour un usage réel**, allez dans **Domains** sur Resend, ajoutez votre propre nom de domaine (par exemple celui de votre site) et suivez leurs instructions pour ajouter les enregistrements DNS demandés. Une fois le domaine vérifié, utilisez une adresse de ce domaine, par exemple `Cours de porcelaine <inscriptions@votredomaine.com>`.
4. Renseignez `ADMIN_EMAIL` avec l'adresse e-mail de l'administratrice (celle qui recevra une notification à chaque inscription).
5. Ajoutez ces trois variables (`RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL`) dans votre `.env` local et/ou dans les variables d'environnement Vercel, puis redéployez si besoin.

## 9. Le webhook SumUp (pour plus tard)

Le fichier `api/webhook.js` contient un squelette prêt à activer : il servira à confirmer automatiquement un paiement et à incrémenter le nombre d'inscrits d'un cours dès que la cliente a réellement payé (plutôt que de faire confiance au simple retour vers la page "Merci"). Les étapes pour l'activer sont détaillées en commentaire dans ce fichier. Tant qu'il n'est pas activé, il se contente de recevoir les notifications de SumUp et de répondre "OK" sans rien faire d'autre — cela ne bloque en rien le fonctionnement du site.

---

## Bon à savoir sur le stockage des données

Les cours et les inscriptions sont enregistrés dans deux fichiers JSON. Sur Vercel, ces fichiers sont réécrits dans un dossier temporaire (`/tmp`), ce qui fonctionne bien pour démarrer et pour un usage avec peu de trafic, mais qui **n'est pas garanti de durer indéfiniment** (le dossier peut être réinitialisé lors d'un redéploiement ou après une longue période d'inactivité). Si l'activité du site grandit, il faudra brancher un vrai stockage permanent (Vercel KV, Upstash Redis ou Supabase) — voir les commentaires dans `api/_store.js` et `api/_registrations.js`, qui expliquent exactement où faire ce changement sans toucher au reste du site.

## Structure du projet

```
cours-porcelaine/
├── public/
│   ├── index.html          page d'inscription publique (avec calendrier)
│   ├── merci.html           page de confirmation après paiement
│   ├── admin.html            tableau de bord d'administration
│   ├── calendar.js             petit module de calendrier réutilisé par les deux pages
│   ├── style.css                 style de la partie publique
│   └── admin-style.css            style sobre du tableau de bord admin
├── api/
│   ├── courses.js          GET public : liste des cours (sans places/inscrits)
│   ├── create-checkout.js  POST public : crée le paiement SumUp + l'inscription
│   ├── admin-courses.js    GET/POST/PUT/DELETE admin : gestion des cours (et des séries récurrentes)
│   ├── admin-registrations.js  GET/PATCH admin : liste des inscriptions, annulation/réactivation
│   ├── webhook.js           squelette du futur webhook SumUp
│   ├── _store.js             stockage des cours (fichier JSON)
│   ├── _registrations.js      stockage des inscriptions (fichier JSON)
│   ├── _email.js                envoi des e-mails via Resend (optionnel)
│   └── _auth.js                   vérification du mot de passe admin
├── data/
│   ├── courses.seed.json      cours de départ (versionnés dans le repo)
│   └── registrations.seed.json  inscriptions de départ (vide)
├── .env.example
├── vercel.json
└── package.json
```
