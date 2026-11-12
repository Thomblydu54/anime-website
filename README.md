# Anime Website - Passerelle de redirection & Android App Links

Ce dépôt héberge le site statique officiel servant de **passerelle de redirection transparente pour les liens de partage universels** (Android App Links) de l'application Android **Anime** (`com.thombly.anime`).

Le site est hébergé sur **GitHub Pages** (https://thomblydu54.github.io/anime-website/), sans aucun framework, aucun outil de compilation ni aucune dépendance externe. Il fonctionne sans interface visible : sa seule fonction est de décoder le code présent dans l'URL et de rediriger immédiatement vers la fiche d'anime correspondante.

---

## 📑 Table des matières

1. [Fonctionnement technique](#1-fonctionnement-technique)
2. [Déploiement sur GitHub Pages](#2-déploiement-sur-github-pages)
3. [Configuration du domaine et CNAME : Les 3 cas](#3-configuration-du-domaine-et-cname--les-3-cas)
4. [Empreinte Play App Signing (.well-known/assetlinks.json)](#4-empreinte-play-app-signing-well-knownassetlinksjson)
5. [Sécurité, Zéro Ressource Tierce et Zéro Interface](#5-sécurité-zéro-ressource-tierce-et-zéro-interface)
6. [Structure du dépôt](#6-structure-du-dépôt)
7. [Checklist et Procédure de Test](#7-checklist-et-procédure-de-test)

---

## 1. Fonctionnement technique

Chaque lien généré par l'application pointe vers une fiche d'anime de manière opaque : **le nom de l'anime n'apparaît jamais en clair dans l'URL**.

### Format des URLs de partage
- Format canonique : `https://thomblydu54.github.io/anime-website/a/<code>`
- Format de secours : `https://thomblydu54.github.io/anime-website/a/?c=<code>`

Le `<code>` est encodé en **Base64URL sans padding** (RFC 4648 §5, alphabet `A-Za-z0-9_-`, sans signe `=`).

### Comportement du système
1. **Sur Android avec l'application installée** : Le système intercepte le lien grâce à la vérification Digital Asset Links (`/.well-known/assetlinks.json`) et ouvre directement la fiche au sein de l'application native.
2. **Sur navigateur ou sans l'application** :
   - Le code est extrait du chemin `/a/<code>` ou du paramètre `?c=<code>`.
   - Il est décodé depuis Base64URL vers UTF-8.
   - L'URL décodée est vérifiée contre la liste blanche des domaines autorisés.
   - **Si valide** : redirection **immédiate** via `location.replace(url)` (aucun délai, aucun spinner, aucun bouton).
   - **Si absent ou invalide** : la page reste totalement vide (fond `#0B0B12`, aucun élément affiché, aucune redirection).

---

## 2. Déploiement sur GitHub Pages

Pour activer ou maintenir l'hébergement sur GitHub Pages :

1. Rendez-vous sur le dépôt GitHub.
2. Cliquez sur l'onglet **Settings** (Paramètres).
3. Dans la barre latérale gauche, cliquez sur **Pages**.
4. Dans la section **Build and deployment** :
   - **Source** : sélectionnez `Deploy from a branch`.
   - **Branch** : sélectionnez la branche `main`, dossier `/ (root)`.
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

---

## 4. Empreinte Play App Signing (.well-known/assetlinks.json)

Le fichier `.well-known/assetlinks.json` associe le domaine à l'application Android.

L'entrée correspondant au package `com.thombly.anime` contient les deux empreintes nécessaires dans son tableau `sha256_cert_fingerprints` :
1. L'empreinte de développement/debug locale :
   `B8:0F:B8:3B:07:C6:11:E0:D5:80:6F:B4:C2:AB:32:0C:20:2B:99:39:58:31:DC:F1:EE:18:DC:43:39:1B:4F:BB`
2. L'empreinte officielle de production Google Play App Signing :
   `3C:B4:C8:0C:A6:52:7E:47:61:2B:05:8A:0A:78:D5:F5:11:99:66:D1:45:4C:FD:A0:B3:BF:7D:12:2A:D6:38:B2`

Le fichier JSON est complet, strictement valide et prêt pour la vérification automatique des Android App Links en production.

---

## 5. Sécurité, Zéro Ressource Tierce et Zéro Interface

Le site applique une politique stricte d'isolation et de performance maximale :

1. **Zéro interface visible** :
   - Aucun logo, aucun texte, aucun titre visible.
   - Aucun bouton, aucun lien vers le Play Store.
   - Aucun spinner ni animation CSS.
   - Fond sombre uni `#0B0B12`.
2. **Redirection immédiate** :
   - Aucun `setTimeout`, aucun délai d'attente.
   - `location.replace(url)` est appelé immédiatement dès validation de l'URL cible.
3. **Zéro ressource tierce & Zéro stockage** :
   - Aucune police distante, aucun CDN, aucune image externe.
   - Aucun usage de `localStorage`, `sessionStorage` ou `document.cookie`.
   - Aucun script d'analyse d'audience (analytics).
   - Aucun appel réseau sortant (`fetch` ou `XMLHttpRequest`).
4. **Content Security Policy (CSP)** :
   Présente sur `index.html`, `404.html` et `a/index.html` :
   ```html
   <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'self'; base-uri 'none'; form-action 'none'">
   ```
5. **Anti Open-Redirect obligatoire** :
   L'hôte de destination doit correspondre exactement aux motifs autorisés :
   - `anime-sama` (ex. `anime-sama.to`, `anime-sama.fr`, et tout domaine valide de la série)
   - `franime.fr` (et `www.franime.fr`)
   - `nakenime.tv` (et `www.nakenime.tv`)
6. **Confidentialité totale de l'URL cible** :
   L'URL décodée n'est jamais écrite dans le DOM, le titre, un attribut `data-*` ou la console.

---

## 6. Structure du dépôt

```text
/
├── .nojekyll                 # Empêche Jekyll d'ignorer le dossier .well-known
├── index.html                # Page vide (fond #0B0B12, sans script)
├── 404.html                  # Fallback SPA GitHub Pages : exécute assets/share.js
├── a/
│   └── index.html            # Copie identique à 404.html pour /a/?c=<code>
├── assets/
│   └── share.js              # Décodage Base64URL et redirection immédiate
├── .well-known/
│   └── assetlinks.json       # Déclaration Android App Links (Digital Asset Links)
└── README.md                 # Documentation technique et checklist de tests
```

---

## 7. Checklist et Procédure de Test

Remplacez `<DOMAINE>` par le domaine de test (ex. `https://thomblydu54.github.io/anime-website` en production ou `http://localhost:8080` en local).

| N° | Scénario de test | URL à tester | Résultat attendu |
|---|---|---|---|
| **1** | **Lien valide** (Anime-Sama) | `<DOMAINE>/a/aHR0cHM6Ly9hbmltZS1zYW1hLnRvL2NhdGFsb2d1ZS9vbmUtcGllY2Uv` | Redirection **immédiate** vers One Piece sans délai ni affichage d'interface. |
| **2** | **Lien valide** (FrAnime) | `<DOMAINE>/a/aHR0cHM6Ly9mcmFuaW1lLmZyL2FuaW1lL2JsZWFjaA` | Redirection **immédiate** vers Bleach. |
| **3** | **Lien valide** (Nakenime) | `<DOMAINE>/a/aHR0cHM6Ly9uYWtlbmltZS50di93YXRjaC9kZWF0aC1ub3Rl` | Redirection **immédiate** vers Death Note. |
| **4** | **Caractères invalides** | `<DOMAINE>/a/aHR0cHM!invalid%code/` | La page reste vide (#0B0B12), aucune redirection. |
| **5** | **Domaine non autorisé (anti open-redirect)** | `<DOMAINE>/a/aHR0cHM6Ly9ldmlsLmV4YW1wbGUv` *(décode vers `https://evil.example/`)* | La page reste vide (#0B0B12), aucune redirection. |
| **6** | **Protocole malveillant (XSS `javascript:`)** | `<DOMAINE>/a/amF2YXNjcmlwdDphbGVydCgxKQ` *(décode vers `javascript:alert(1)`)* | La page reste vide (#0B0B12), aucune redirection. |
| **7** | **Chemin `/a/` sans code** | `<DOMAINE>/a/` | La page reste vide (#0B0B12), aucune redirection. |
| **8** | **Digital Asset Links (App Links)** | `<DOMAINE>/.well-known/assetlinks.json` | Réponse HTTP `200` avec le fichier JSON complet contenant les deux entrées et les empreintes SHA-256. |
| **9** | **Forme de secours query string** | `<DOMAINE>/a/?c=aHR0cHM6Ly9mcmFuaW1lLmZyL2FuaW1lL2JsZWFjaA` | Redirection immédiate vers Bleach. |
