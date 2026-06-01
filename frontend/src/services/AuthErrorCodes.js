// Codici stabili degli errori auth (devono restare in sync con il backend).
// Per l'i18n: sostituisci AUTH_ERROR_MESSAGES con una funzione t(code) dell'i18n.
export const AuthErrorCodes = {
  InvalidCredentials:        'invalid_credentials',
  EmailNotConfirmed:         'email_not_confirmed',
  InvalidConfirmationToken:  'invalid_confirmation_token',
  UserNotFound:              'user_not_found',
  InvalidGoogleToken:        'invalid_google_token',
  GoogleEmailNotVerified:    'google_email_not_verified',
  GoogleAccountCreateFailed: 'google_account_create_failed',
  EmailAlreadyRegistered:    'email_already_registered',
  UsernameAlreadyTaken:      'username_already_taken',
  PasswordRejected:          'password_rejected',
};

// Dizionario IT — qui andrebbe la chiamata a un sistema i18n in futuro.
const AUTH_ERROR_MESSAGES_IT = {
  [AuthErrorCodes.InvalidCredentials]:        'Email o password non corretti.',
  [AuthErrorCodes.EmailNotConfirmed]:         'Email non confermata. Controlla la tua casella di posta.',
  [AuthErrorCodes.InvalidConfirmationToken]:  'Link di conferma non valido o scaduto.',
  [AuthErrorCodes.UserNotFound]:              'Utente non trovato.',
  [AuthErrorCodes.InvalidGoogleToken]:        'Token Google non valido.',
  [AuthErrorCodes.GoogleEmailNotVerified]:    'La tua email Google non è verificata.',
  [AuthErrorCodes.GoogleAccountCreateFailed]: 'Impossibile creare l\'account con Google.',
  [AuthErrorCodes.EmailAlreadyRegistered]:    'Questa email è già registrata.',
  [AuthErrorCodes.UsernameAlreadyTaken]:      'Username già in uso. Scegline un altro.',
  [AuthErrorCodes.PasswordRejected]:          'La password non rispetta i requisiti.',
};

/**
 * Risolve un codice d'errore auth in un messaggio user-facing.
 * Fallback: usa il messaggio del server, poi un generico.
 */
export const authMessage = (code, serverMessage) =>
  AUTH_ERROR_MESSAGES_IT[code] || serverMessage || 'Si è verificato un errore.';
