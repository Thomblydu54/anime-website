/**
 * ==========================================================================
 * Anime - share.js
 * Source unique pour le décodage, la validation et la redirection des liens /a/
 * Zéro dépendance externe - Conforme RFC 4648 §5 & CSP stricte
 * ==========================================================================
 */

/**
 * Préfixe officiel des liens de partage.
 * Modifiable si le site est hébergé sous un sous-dossier ou un domaine personnalisé.
 */
const LINK_PREFIX = location.origin + '/a/';

/**
 * Dictionnaire bilingue FR/EN (FR par défaut selon navigator.language).
 */
const I18N = {
  fr: {
    app_name: 'Anime',
    app_subtitle: 'Application Android',
    page_title_loading: 'Anime - Redirection...',
    page_title_error: 'Anime - Lien non valide',
    loading_title: 'Redirection vers votre anime...',
    loading_subtitle: 'Ouverture dans quelques instants...',
    btn_open_app: "Ouvrir dans l'application",
    btn_continue: 'Continuer sur le site',
    test_mode_notice: 'Mode test (?stay=1) : la redirection automatique est désactivée.',
    error_title: "Ce lien n'est pas valide ou a expiré",
    error_message: "Le lien de partage que vous avez suivi est incorrect, corrompu ou a expiré. Téléchargez l'application Anime pour accéder aux fiches et au catalogue complet.",
    btn_get_app: "Télécharger l'application",
    btn_home: "Retour à l'accueil"
  },
  en: {
    app_name: 'Anime',
    app_subtitle: 'Android App',
    page_title_loading: 'Anime - Redirecting...',
    page_title_error: 'Anime - Invalid link',
    loading_title: 'Redirecting to your anime...',
    loading_subtitle: 'Opening in a few moments...',
    btn_open_app: 'Open in app',
    btn_continue: 'Continue to website',
    test_mode_notice: 'Test mode (?stay=1): automatic redirection is paused.',
    error_title: 'This link is invalid or has expired',
    error_message: 'The share link you followed is incorrect, corrupted, or has expired. Download the Anime app to access anime sheets and the full catalog.',
    btn_get_app: 'Download the app',
    btn_home: 'Back to home'
  }
};

/**
 * Liste blanche stricte des hôtes autorisés (anti open-redirect).
 * Comparaison exacte uniquement (aucun endsWith naïf).
 */
const ALLOWED_HOSTS = new Set([
  'anime-sama.to',
  'www.anime-sama.to',
  'anime-sama.fr',
  'www.anime-sama.fr',
  'anime-sama.net',
  'www.anime-sama.net',
  'anime-sama.com',
  'www.anime-sama.com',
  'franime.fr',
  'www.franime.fr',
  'nakenime.tv',
  'www.nakenime.tv'
]);

/**
 * Détermine la langue active (FR par défaut, EN si le navigateur commence par 'en').
 * @returns {'fr' | 'en'}
 */
function getActiveLanguage() {
  const lang = (navigator.language || '').toLowerCase();
  return lang.startsWith('en') ? 'en' : 'fr';
}

/**
 * Récupère le code opaque depuis l'URL courante.
 * 1. Paramètre 'c' dans la query string (forme de secours /a/?c=<code>)
 * 2. Segment suivant immédiatement '/a/' dans le chemin
 * @returns {string|null}
 */
function extractCode() {
  try {
    const params = new URLSearchParams(location.search);
    const queryCode = params.get('c');
    if (queryCode && queryCode.trim()) {
      return queryCode.trim();
    }
  } catch (_) {}

  const pathname = location.pathname || '';
  const aIdx = pathname.indexOf('/a/');
  if (aIdx !== -1) {
    const after = pathname.slice(aIdx + 3);
    const segments = after.split('/').filter(Boolean);
    if (segments.length > 0) {
      return segments[0].trim();
    }
  }

  return null;
}

/**
 * Décode un code Base64URL sans padding (RFC 4648 §5) en chaîne UTF-8.
 * @param {string} code
 * @returns {string|null}
 */
function decodeCode(code) {
  if (!code || typeof code !== 'string') return null;
  if (!/^[A-Za-z0-9_-]+$/.test(code)) return null;

  let b64 = code.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) {
    b64 += '=';
  }

  try {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

/**
 * Valide strictement l'URL décodée avant toute redirection :
 * 1. Doit commencer par https:// (refuse http, javascript, intent, data, etc.)
 * 2. Protocole validé 'https:'
 * 3. Hôte comparé strictement à la liste blanche autorisée
 * @param {string|null} rawUrl
 * @returns {string|null} L'URL validée ou null en cas de refus
 */
function validateUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  if (!rawUrl.startsWith('https://')) return null;

  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return null;

    const hostname = parsed.hostname.toLowerCase();
    if (!ALLOWED_HOSTS.has(hostname)) return null;

    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Initialise la page de partage /a/
 */
function initSharePage() {
  const langKey = getActiveLanguage();
  const texts = I18N[langKey];

  // Application des textes localisés statiques
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setText('text-app-name', texts.app_name);
  setText('text-app-subtitle', texts.app_subtitle);
  setText('text-loading-title', texts.loading_title);
  setText('text-loading-subtitle', texts.loading_subtitle);
  setText('text-btn-open-app', texts.btn_open_app);
  setText('text-btn-continue', texts.btn_continue);
  setText('text-test-mode', texts.test_mode_notice);
  setText('text-error-title', texts.error_title);
  setText('text-error-message', texts.error_message);
  setText('text-btn-get-app', texts.btn_get_app);
  setText('text-btn-home', texts.btn_home);

  const stateLoading = document.getElementById('state-loading');
  const stateError = document.getElementById('state-error');
  const btnContinue = document.getElementById('btn-continue');
  const noticeTestMode = document.getElementById('notice-test-mode');

  function showErrorState() {
    if (stateLoading) stateLoading.classList.add('hidden');
    if (stateError) stateError.classList.remove('hidden');
    document.title = texts.page_title_error;
  }

  const rawCode = extractCode();
  if (!rawCode) {
    showErrorState();
    return;
  }

  const decoded = decodeCode(rawCode);
  if (!decoded) {
    showErrorState();
    return;
  }

  const validTarget = validateUrl(decoded);
  if (!validTarget) {
    showErrorState();
    return;
  }

  // L'URL est valide : on conserve validTarget dans la portée locale uniquement.
  // Elle ne sera JAMAIS écrite dans le DOM visible, le titre, un data-*, ni dans la console.
  document.title = texts.page_title_loading;

  let redirectTimer = null;
  const params = new URLSearchParams(location.search);
  const isStay = params.get('stay') === '1';

  if (isStay) {
    if (noticeTestMode) {
      noticeTestMode.classList.remove('hidden');
    }
  } else {
    redirectTimer = setTimeout(() => {
      location.replace(validTarget);
    }, 1200);
  }

  if (btnContinue) {
    btnContinue.addEventListener('click', () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
      location.replace(validTarget);
    });
  }
}

// Initialisation dès que le DOM est prêt
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSharePage);
} else {
  initSharePage();
}
