# Anime Website - Cible de liens de partage & Android App Links

Ce dépôt héberge le site statique officiel servant de **cible pour les liens de partage universels** (Android App Links) émis par l'application Android **Anime** (`com.thombly.anime`).

Le site est conçu pour être publié directement sur **GitHub Pages**, sans aucun framework, aucun outil de compilation ni aucune dépendance externe (aucun CDN, aucune police distante, aucun script tiers).

---

## 📑 Table des matières

1. [Fonctionnement technique](#1-fonctionnement-technique)
2. [Déploiement sur GitHub Pages](#2-déploiement-sur-github-pages)
3. [Configuration du domaine et CNAME : Les 3 cas](#3-configuration-du-domaine-et-cname--les-3-cas)
4. [Empreinte Play App Signing (.well-known/assetlinks.json)](#4-empreinte-play-app-signing-well-knownassetlinksjson)
5. [Sécurité, Zéro Ressource Tierce et Zéro Stockage](#5-sécurité-zéro-ressource-tierce-et-zéro-stockage)
6. [Structure du dépôt](#6-structure-du-dépôt)
7. [Checklist et Procédure de Test](#7-checklist-et-procédure-de-test)

---

## 1. Fonctionnement technique

Chaque lien généré par l'application pointe vers une fiche d'anime de manière opaque : **le nom de l'anime n'apparaît jamais en clair dans l'URL**.

### Format des URLs de partage
- Format canonique : `https://<DOMAINE>/a/<code>`
- Format de secours : `https://<DOMAINE>/a/?c=<code>`

Le `<code>` est encodé en **Base64URL sans padding** (RFC 4648 §5, alphabet `A-Za-z0-9_-`, sans signe `=`).

### Comportement du système
1. **Sur Android avec l'application installée** : Le système intercepte le lien grâce à la vérification Digital Asset Links (`/.well-known/assetlinks.json`) et ouvre directement la fiche au sein de l'application native.
2. **Sur navigateur ou sans l'application** :
   - Si le code est valide et pointe vers un hôte autorisé : affiche un indicateur de chargement et redirige automatiquement vers le site partenaire après **1 200 ms** via `location.replace()`.
   - Deux boutons restent disponibles : *« Ouvrir dans l'application »* (lien vers le Google Play Store) et *« Continuer sur le site »* (redirection immédiate).
   - Mode test : si l'URL contient le paramètre `?stay=1` (ex. `/a/<code>?stay=1`), la redirection automatique est mise en pause.
   - Si le lien est invalide, altéré ou pointe vers un domaine non autorisé : affichage d'une carte sobre *« Ce lien n'est pas valide ou a expiré »* avec bouton vers le Play Store, sans aucune redirection.

---

## 2. Déploiement sur GitHub Pages

Pour activer l'hébergement sur GitHub Pages :

1. Rendez-vous sur le dépôt GitHub.
2. Cliquez sur l'onglet **Settings** (Paramètres).
3. Dans la barre latérale gauche, cliquez sur **Pages**.
4. Dans la section **Build and deployment** :
   - **Source** : sélectionnez `Deploy from a branch`.
   - **Branch** : sélectionnez la branche `main` (ou la branche active), dossier `/ (root)`.
   - Cliquez sur **Save**.
5. Cochez impérativement la case **Enforce HTTPS** une fois le certificat provisionné.
6. Le fichier vide `.nojekyll` présent à la racine garantit que le dossier `.well-known/` et son fichier `assetlinks.json` ne sont pas ignorés par le moteur de publication.

---

## 3. Configuration du domaine et CNAME : Les 3 cas

Un fichier `CNAME` ne sert **que** pour un domaine personnalisé acheté. Il ne règle **pas** le cas d'un site servi sous `/<repo>/`. Voici les trois cas de figure et leur impact sur Android App Links :

### a. Dépôt nommé `<PSEUDO>.github.io`
- Le site est servi à la racine absolue : `https://<PSEUDO>.github.io/`.
- Le fichier `/.well-known/assetlinks.json` est immédiatement accessible à la racine.
- La vérification des Android App Links réussit sans configuration supplémentaire.
- **Aucun fichier CNAME n'est requis.**

### b. Dépôt avec un autre nom (ex. `anime-website`)
- Le site est servi sous le sous-dossier : `https://<PSEUDO>.github.io/<repo>/`.
- Les liens de partage deviennent `https://<PSEUDO>.github.io/<repo>/a/<code>`.
- **La vérification App Links est impossible** : le système Android interroge exclusivement `https://<PSEUDO>.github.io/.well-known/assetlinks.json` (à la racine de l'hôte), qui n'est pas servi par ce sous-dossier.
- En conséquence, Android affiche le sélecteur app/navigateur au lieu d'ouvrir directement l'application.
- **Important** : Ajouter un `CNAME` dans ce dépôt ne résout pas ce problème si aucun domaine personnalisé n'a été acheté.

### c. Domaine personnalisé (ex. `anime.thombly.com`)
- Nécessite la possession d'un nom de domaine propre.
- Créez un fichier `CNAME` à la racine du dépôt contenant uniquement le domaine (ex. `anime.thombly.com`).
- Configurez les enregistrements DNS chez le registraire (CNAME pointant vers `<PSEUDO>.github.io` ou enregistrements A vers les IP GitHub Pages).
- Activez **Enforce HTTPS** dans GitHub Pages.
- Le fichier `assetlinks.json` est alors bien accessible à la racine du domaine personnalisé (`https://anime.thombly.com/.well-known/assetlinks.json`), rendant la vérification App Links opérationnelle.

### Constante de préfixe dans le code
La constante est centralisée en tête de `assets/share.js` :

```javascript
// assets/share.js (ligne 14)
const LINK_PREFIX = location.origin + '/a/';
```

Elle s'adapte dynamiquement à l'origine active (`location.origin + '/a/'`).

---

## 4. Empreinte Play App Signing (.well-known/assetlinks.json)

Le fichier `.well-known/assetlinks.json` associe le domaine à l'application Android.

L'entrée correspondant au package `com.thombly.anime` contient **deux** empreintes dans son tableau `sha256_cert_fingerprints` :
1. L'empreinte de développement/debug locale :
   `B8:0F:B8:3B:07:C6:11:E0:D5:80:6F:B4:C2:AB:32:0C:20:2B:99:39:58:31:DC:F1:EE:18:DC:43:39:1B:4F:BB`
2. L'empreinte officielle de production Google Play App Signing :
   `3C:B4:C8:0C:A6:52:7E:47:61:2B:05:8A:0A:78:D5:F5:11:99:66:D1:45:4C:FD:A0:B3:BF:7D:12:2A:D6:38:B2`

### Emplacement de la valeur dans la Google Play Console
Cette empreinte de signature a été récupérée depuis :
**Google Play Console** → Sélection de l'application **Anime** → **Test et publication** → **Intégrité de l'application** → section **Certificat de clé de signature d'application** → champ **Empreinte de certificat SHA-256**.

Le fichier JSON est complet, strictement valide et prêt pour la vérification automatique des Android App Links en production.

---

## 5. Sécurité, Zéro Ressource Tierce et Zéro Stockage

Le site applique une politique stricte d'isolation et de respect de la vie privée :

1. **Zéro ressource tierce** :
   - Aucun appel vers des polices distantes (Google Fonts), des CDN (jsDelivr, unpkg, cdnjs) ou des services tiers (Cloudflare).
   - Aucune balise de préconnexion distante ni script externe chargé depuis le web.
   - Aucune image ou icône externe : tous les pictogrammes SVG sont intégrés inline dans le HTML.
   - Typographie système exclusivement (`-apple-system, Segoe UI, Roboto, sans-serif`).
2. **Zéro stockage & Zéro traçage** :
   - Aucun usage de `localStorage`, `sessionStorage` ou `document.cookie`.
   - Aucun script d'analyse d'audience (analytics).
   - Aucun appel réseau sortant (`fetch` ou `XMLHttpRequest`).
3. **Content Security Policy (CSP)** :
   Présente sur `index.html`, `404.html` et `a/index.html` :
   ```html
   <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'">
   ```
   - N'autorise que `script-src 'self'` et `style-src 'self' 'unsafe-inline'`.
   - **Aucun script inline** n'est présent dans les pages HTML : `404.html` et `a/index.html` chargent la source unique `assets/share.js`.
4. **Anti Open-Redirect obligatoire** :
   L'URL cible est analysée avec l'objet natif `URL`. Son protocole doit être `https:` et son hôte doit correspondre exactement à la liste blanche :
   - `anime-sama.to`, `anime-sama.fr`, `anime-sama.net`, `anime-sama.com` (et sous-domaines `www.`)
   - `franime.fr` (et `www.franime.fr`)
   - `nakenime.tv` (et `www.nakenime.tv`)
5. **Confidentialité de l'URL cible** :
   L'URL décodée n'est jamais écrite dans le DOM visible, le titre, un attribut `data-*` ou la console.

---

## 6. Structure du dépôt

```text
/
├── .nojekyll                 # Empêche Jekyll d'ignorer le dossier .well-known
├── index.html                # Page d'accueil présentant l'application Android
├── 404.html                  # Fallback SPA GitHub Pages pour gérer /a/<code>
├── a/
│   └── index.html            # Gestion du format de secours /a/?c=<code>
├── assets/
│   ├── share.js              # Décodage, validation et redirection (source unique)
│   └── style.css             # Thème sombre sobre & premium (styles partagés)
├── .well-known/
│   └── assetlinks.json       # Déclaration Android App Links (Digital Asset Links)
└── README.md                 # Documentation technique et checklist de tests
```

---

## 7. Checklist et Procédure de Test

Remplacez `<DOMAINE>` par le domaine de test (ex. `http://localhost:8080` en local ou `https://thomblydu54.github.io` en production).

| N° | Scénario de test | URL à tester | Résultat attendu |
|---|---|---|---|
| **1** | **Lien valide** (Anime-Sama) | `<DOMAINE>/a/aHR0cHM6Ly9hbmltZS1zYW1hLnRvL2NhdGFsb2d1ZS9vbmUtcGllY2Uv` | Affiche la carte de chargement avec spinner, puis redirige après ~1,2 s vers la fiche One Piece. |
| **2** | **Mode test `?stay=1`** | `<DOMAINE>/a/aHR0cHM6Ly9hbmltZS1zYW1hLnRvL2NhdGFsb2d1ZS9vbmUtcGllY2Uv?stay=1` | Affiche le badge « Mode test (?stay=1) : la redirection automatique est désactivée ». **Aucune redirection automatique**. Le bouton « Continuer sur le site » fonctionne au clic. |
| **3** | **Caractères invalides** | `<DOMAINE>/a/aHR0cHM!invalid%code/` | Carte d'erreur sobre : *« Ce lien n'est pas valide ou a expiré »*. Bouton vers Google Play Store. Aucune redirection. |
| **4** | **Domaine non autorisé (anti open-redirect)** | `<DOMAINE>/a/aHR0cHM6Ly9ldmlsLmV4YW1wbGUv` *(décode vers `https://evil.example/`)* | Carte d'erreur sobre. **Aucune redirection** vers le domaine tiers. |
| **5** | **Protocole malveillant (XSS `javascript:`)** | `<DOMAINE>/a/amF2YXNjcmlwdDphbGVydCgxKQ` *(décode vers `javascript:alert(1)`)* | Carte d'erreur sobre. Aucune exécution de script, aucune redirection. |
| **6** | **Chemin `/a/` sans code** | `<DOMAINE>/a/` | Carte d'erreur sobre affichée directement, invitant à télécharger l'application. |
| **7** | **Mise en page mobile 320 px** | N'importe quelle page sous viewport 320 px | La carte est parfaitement centrée, les boutons s'adaptent, pas de débordement horizontal ni de coupure de texte. |
| **8** | **Digital Asset Links (App Links)** | `<DOMAINE>/.well-known/assetlinks.json` | Réponse HTTP `200` avec le fichier JSON complet contenant les deux entrées et les empreintes SHA-256 (y compris celle de Play App Signing). |
| **9** | **Forme de secours query string** | `<DOMAINE>/a/?c=aHR0cHM6Ly9mcmFuaW1lLmZyL2FuaW1lL2JsZWFjaA&stay=1` | Décode correctement vers la fiche Bleach sur franime.fr en mode test. |
