// Vite espone le env var con prefisso REACT_APP_ (configurato in vite.config.js)
// via import.meta.env, in modo da non rompere i compose esistenti.
const env = import.meta.env;

export const APP_CONFIG = {
  AUTH_SERVICE_URL: env.REACT_APP_AUTH_SERVICE_URL || 'http://localhost:5001',
  QUIZ_SERVICE_URL: env.REACT_APP_QUIZ_SERVICE_URL || 'http://localhost:8080',
  USER_SERVICE_URL: env.REACT_APP_USER_SERVICE_URL || 'http://localhost:5002',

  GOOGLE_CLIENT_ID: env.REACT_APP_GOOGLE_CLIENT_ID || '',

  HTTP_CONFIG:         { TIMEOUT: 30000, RETRY_ATTEMPTS: 3 },
  AUTH_CONFIG:         { TOKEN_KEY: 'jwt', TOKEN_EXPIRY_CHECK_INTERVAL: 60000 },
  QUIZ_CONFIG:         { MAX_QUESTIONS_PER_QUIZ: 20, MIN_QUESTIONS_PER_QUIZ: 1 },
  UI_CONFIG:           { ANIMATION_DURATION: 300, MESSAGE_DISPLAY_DURATION: 3000 },
  NOTIFICATION_CONFIG: { SUCCESS_DURATION: 3000, ERROR_DURATION: 5000, WARNING_DURATION: 4000 },
};

export const getConfig = (key) => {
  const keys = key.split('.');
  let value = APP_CONFIG;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) value = value[k];
    else return undefined;
  }
  return value;
};

/** Verifica che le env essenziali siano valorizzate. Chiamata in fase di bootstrap. */
export const validateConfig = () => {
  const required = ['AUTH_SERVICE_URL', 'QUIZ_SERVICE_URL', 'USER_SERVICE_URL'];
  const missing = required.filter((k) => !APP_CONFIG[k]);
  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error('[config] env mancanti:', missing);
    return false;
  }
  return true;
};
