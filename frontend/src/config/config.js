export const APP_CONFIG = {
  AUTH_SERVICE_URL: process.env.REACT_APP_AUTH_SERVICE_URL || 'http://localhost:5001',
  QUIZ_SERVICE_URL: process.env.REACT_APP_QUIZ_SERVICE_URL || 'http://localhost:8080',
  USER_SERVICE_URL: process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:5002',

  HTTP_CONFIG:   { TIMEOUT: 30000, RETRY_ATTEMPTS: 3 },
  AUTH_CONFIG:   { TOKEN_KEY: 'jwt', TOKEN_EXPIRY_CHECK_INTERVAL: 60000 },
  QUIZ_CONFIG:   { MAX_QUESTIONS_PER_QUIZ: 20, MIN_QUESTIONS_PER_QUIZ: 1 },
  UI_CONFIG:     { ANIMATION_DURATION: 300, MESSAGE_DISPLAY_DURATION: 3000, LOADING_SPINNER_SIZE: '3rem' },
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
