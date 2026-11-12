# Anime Website - Cible de liens de partage & Android App Links

Ce dépôt héberge le site statique officiel servant de **cible pour les liens de partage universels** (Android App Links) émis par l'application Android **Anime** (`com.thombly.anime`).

Le site est conçu pour être publié directement sur **GitHub Pages**, sans aucun framework, aucun outil de compilation ni aucune dépendance externe (aucun CDN, aucune police distante, aucun script tiers).

---

## 📑 Table des matières

1. [Fonctionnement technique](#1-fonctionnement-technique)
2. [Déploiement sur GitHub Pages](#2-déploiement-sur-github-pages)
3. [Configuration du domaine et CNAME](#3-configuration-du-domaine-et-cname)
4. [Ajout de l'empreinte Play App Signing](#4-ajout-de-lempreinte-play-app-signing)
5. [Sécurité et Anti Open-Redirect](#5-sécurité-et-anti-open-redirect)
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

1. Rendez-vous sur votre dépôt GitHub : `https://github.com/<PSEUDO>/<NOM_DU_REPO>`.
2. Cliquez sur l'onglet **Settings** (Paramètres).
3. Dans la barre latérale gauche, cliquez sur **Pages**.
4. Dans la section **Build and deployment** :
   - **Source** : sélectionnez `Deploy from a branch`.
   - **Branch** : sélectionnez la branche `main` (ou la branche par défaut), dossier `/ (root)`.
   - Cliquez sur **Save**.
5. Cochez impérativement la case **Enforce HTTPS** une fois le certificat provisionné.
6. Le fichier vide `.nojekyll` présent à la racine garantit que le dossier `.well-known/` et son fichier `assetlinks.json` ne sont pas ignorés par le moteur de publication.

---

## 3. Configuration du domaine et CNAME

### Recommandation importante pour les App Links
Pour que la vérification automatique des Android App Links réussisse, le fichier `assetlinks.json` **doit impérativement être accessible à la racine absolue du domaine** :
`https://<DOMAINE>/.well-known/assetlinks.json`

Deux configurations sont possibles :

#### Option A : Dépôt utilisateur `<PSEUDO>.github.io` (Recommandé)
En nommant le dépôt GitHub exactement `<PSEUDO>.github.io` (ex. `thomblydu54.github.io`), le site est servi directement à la racine `https://<PSEUDO>.github.io/`.
Les liens de partage sont alors `https://<PSEUDO>.github.io/a/<code>` et `/.well-known/assetlinks.json` est immédiatement disponible.

#### Option B : Domaine personnalisé avec CNAME (Recommandé si le dépôt s'appelle `anime-website`)
Si le dépôt porte un nom générique comme `anime-website`, GitHub Pages le servira par défaut sous `https://<PSEUDO>.github.io/anime-website/`. Dans cette configuration, les App Links ne peuvent pas valider le fichier `assetlinks.json` à la racine de `github.io`.

Pour utiliser un nom de domaine personnalisé (ex. `anime.thombly.com` ou `mon-anime-site.fr`) :
1. Créez un fichier `CNAME` à la racine du dépôt contenant uniquement votre domaine personnalisé (ex. `anime.thombly.com`).
2. Chez votre registraire DNS, ajoutez un enregistrement :
   - Pour un sous-domaine : type `CNAME` pointant vers `<PSEUDO>.github.io`.
   - Pour un domaine racine (apex) : type `A` pointant vers les IP GitHub Pages (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153).
3. Dans **Settings > Pages > Custom domain**, renseignez votre domaine et activez **Enforce HTTPS**.

### Où modifier la constante de domaine dans le code ?
La constante est centralisée à la toute première ligne de `assets/share.js` :

```javascript
// assets/share.js (ligne 14)
const LINK_PREFIX = location.origin + '/a/';
```

Par défaut, elle utilise dynamiquement l'origine du site actuel (`location.origin + '/a/'`), ce qui fonctionne sans modification aussi bien sur domaine personnalisé que sur `<PSEUDO>.github.io`.

---

## 4. Ajout de l'empreinte Play App Signing

Le fichier `.well-known/assetlinks.json` associe votre domaine à l'application Android. Il contient déjà l'empreinte de développement SHA-256.

Le format JSON ne permettant pas d'insérer de commentaires, voici comment ajouter l'empreinte **Google Play App Signing** de production :

1. Ouvrez la [Google Play Console](https://play.google.com/console).
2. Sélectionnez votre application **Anime**.
3. Allez dans le menu : **Configuration** (Setup) > **Intégrité de l'application** (App Integrity).
4. Sous l'onglet **Certificat de clé de signature d'application** (App signing key certificate), copiez l'**Empreinte de certificat SHA-256**.
5. Ouvrez le fichier `.well-known/assetlinks.json` de ce dépôt.
6. Dans l'objet correspondant au package `com.thombly.anime`, **ajoutez** votre empreinte dans le tableau `sha256_cert_fingerprints` (ne supprimez jamais l'empreinte existante, ajoutez une virgule et la nouvelle empreinte) :

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.example.anime",
      "sha256_cert_fingerprints": [
        "B8:0F:B8:3B:07:C6:11:E0:D5:80:6F:B4:C2:AB:32:0C:20:2B:99:39:58:31:DC:F1:EE:18:DC:43:39:1B:4F:BB"
      ]
    }
  },
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.thombly.anime",
      "sha256_cert_fingerprints": [
        "B8:0F:B8:3B:07:C6:11:E0:D5:80:6F:B4:C2:AB:32:0C:20:2B:99:39:58:31:DC:F1:EE:18:DC:43:39:1B:4F:BB",
        "COLLER_ICI_VOTRE_NOUVELLE_EMPREINTE_SHA256_PLAY_APP_SIGNING"
      ]
    }
  }
]
```

7. Enregistrez et committez le fichier.

---

## 5. Sécurité et Anti Open-Redirect

Le site implémente plusieurs mécanismes de sécurité stricts :

1. **Anti Open-Redirect obligatoire** :
   L'URL décodée est analysée avec le constructeur natif `new URL()`. Elle doit impérativement débuter par `https://` et son hôte (`hostname`) doit appartenir strictement à la liste blanche :
   - `anime-sama.to`, `anime-sama.fr`, `anime-sama.net`, `anime-sama.com` (et sous-domaines `www.`)
   - `franime.fr` (et `www.franime.fr`)
   - `nakenime.tv` (et `www.nakenime.tv`)
   Tout autre domaine (ex. `evil.example`, domaine leurre `anime-sama.to.evil.com`) est immédiatement rejeté.
2. **Confidentialité totale du lien** :
   L'URL décodée n'est **jamais** écrite dans le DOM visible, ni dans le titre de la page, ni dans un attribut `data-*`, ni enregistrée dans la console du navigateur (`console.log`). Elle demeure uniquement en mémoire vive JS dans une fermeture locale.
3. **Content Security Policy (CSP)** :
   Toutes les pages intègrent la métadonnée :
   ```html
   <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'">
   ```
4. **Indexation désactivée sur les liens** :
   Les pages `/a/` et le fallback `404.html` portent `<meta name="robots" content="noindex,nofollow">`.

---

## 6. Structure du dépôt

```text
/
├── .nojekyll                 # Empêche Jekyll d'ignorer le dossier .well-known
├── index.html                # Page d'accueil sobre présentant l'application Android
├── 404.html                  # Fallback SPA GitHub Pages pour gérer /a/<code>
├── a/
│   └── index.html            # Gestion du format de secours /a/?c=<code>
├── assets/
│   ├── share.js              # Décodage, validation, sécurité et redirection (source unique)
│   └── style.css             # Thème sombre sobre & premium partagé
├── .well-known/
│   └── assetlinks.json       # Déclaration Android App Links (Digital Asset Links)
└── README.md                 # Documentation complète et checklist de tests
```

---

## 7. Checklist et Procédure de Test

Remplacez `<DOMAINE>` par votre domaine (ex. `http://localhost:8080` en local ou `https://thomblydu54.github.io` en production).

| N° | Scénario de test | URL à tester | Résultat attendu |
|---|---|---|---|
| **1** | **Lien valide** (Anime-Sama) | `<DOMAINE>/a/aHR0cHM6Ly9hbmltZS1zYW1hLnRvL2NhdGFsb2d1ZS9vbmUtcGllY2Uv` | Affiche la carte de chargement avec spinner, puis redirige après ~1,2 s vers la fiche One Piece. |
| **2** | **Mode test `?stay=1`** | `<DOMAINE>/a/aHR0cHM6Ly9hbmltZS1zYW1hLnRvL2NhdGFsb2d1ZS9vbmUtcGllY2Uv?stay=1` | Affiche le badge « Mode test (?stay=1) : la redirection automatique est désactivée ». **Aucune redirection automatique**. Le bouton « Continuer sur le site » fonctionne au clic. |
| **3** | **Caractères invalides** | `<DOMAINE>/a/aHR0cHM!invalid%code/` | Carte d'erreur sobre : *« Ce lien n'est pas valide ou a expiré »*. Bouton vers Google Play Store. Aucune redirection. |
| **4** | **Domaine non autorisé (anti open-redirect)** | `<DOMAINE>/a/aHR0cHM6Ly9ldmlsLmV4YW1wbGUv` *(décode vers `https://evil.example/`)* | Carte d'erreur sobre. **Aucune redirection** vers le domaine tiers. |
| **5** | **Protocole malveillant (XSS `javascript:`)** | `<DOMAINE>/a/amF2YXNjcmlwdDphbGVydCgxKQ` *(décode vers `javascript:alert(1)`)* | Carte d'erreur sobre. Aucune exécution de script, aucune redirection. |
| **6** | **Chemin `/a/` sans code** | `<DOMAINE>/a/` | Carte d'erreur sobre affichée directement, invitant à télécharger l'application. |
| **7** | **Mise en page mobile 320 px** | N'importe quelle page sous viewport 320 px | La carte est parfaitement centrée, les boutons s'adaptent, pas de débordement horizontal ni de coupure de texte. |
| **8** | **Digital Asset Links (App Links)** | `<DOMAINE>/.well-known/assetlinks.json` | Réponse HTTP `200` avec le fichier JSON complet contenant les packages `com.example.anime` et `com.thombly.anime`. |
| **9** | **Forme de secours query string** | `<DOMAINE>/a/?c=aHR0cHM6Ly9mcmFuaW1lLmZyL2FuaW1lL2JsZWFjaA&stay=1` | Décode correctement vers la fiche Bleach sur franime.fr en mode test. |
