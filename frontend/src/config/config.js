// src/config/config.js

// Configurazioni dell'applicazione
export const APP_CONFIG = {
  // Endpoint dell'API
  API_ENDPOINT: process.env.REACT_APP_ENDPOINT,
  
  // Configurazioni per le richieste HTTP
  HTTP_CONFIG: {
    TIMEOUT: 30000, // 30 secondi
    RETRY_ATTEMPTS: 3,
  },
  
  // Configurazioni per l'autenticazione
  AUTH_CONFIG: {
    TOKEN_KEY: 'jwt',
    TOKEN_EXPIRY_CHECK_INTERVAL: 60000, // 1 minuto
  },
  
  // Configurazioni per i quiz
  QUIZ_CONFIG: {
    MAX_QUESTIONS_PER_QUIZ: 20,
    MIN_QUESTIONS_PER_QUIZ: 5,
    DEFAULT_QUIZ_DURATION: 300, // 5 minuti in secondi
  },
  
  // Configurazioni per l'UI
  UI_CONFIG: {
    ANIMATION_DURATION: 300, // millisecondi
    MESSAGE_DISPLAY_DURATION: 3000, // 3 secondi
    LOADING_SPINNER_SIZE: '3rem',
  },
  
  // Configurazioni per le notifiche
  NOTIFICATION_CONFIG: {
    SUCCESS_DURATION: 3000,
    ERROR_DURATION: 5000,
    WARNING_DURATION: 4000,
  }
};

// Utility per ottenere la configurazione
export const getConfig = (key) => {
  const keys = key.split('.');
  let value = APP_CONFIG;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return undefined;
    }
  }
  
  return value;
};

// Utility per validare la configurazione
export const validateConfig = () => {
  const requiredKeys = ['API_ENDPOINT'];
  const missingKeys = [];
  
  for (const key of requiredKeys) {
    if (!getConfig(key)) {
      missingKeys.push(key);
    }
  }
  
  if (missingKeys.length > 0) {
    console.error('Configurazioni mancanti:', missingKeys);
    return false;
  }
  
  return true;
};
