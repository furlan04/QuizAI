// ============================================================================
// apiClient — unico punto di accesso HTTP del frontend.
//
// Punti chiave:
//   • il JWT vive in un cookie httpOnly `access_token` (non leggibile da JS):
//     ogni richiesta usa `credentials: 'include'` così il browser lo invia da solo
//   • niente più Authorization header né sessionStorage
//   • normalizza la risposta a { ok, status, data, error, errorCode }
//   • gestisce 401 globalmente (logout + redirect a /login)
//   • supporta AbortSignal per cancellation
//   • niente throw nelle chiamate "normali": il chiamante non deve avvolgere
//     in try/catch (solo le eccezioni di rete vengono catturate qui dentro)
// ============================================================================

import { getConfig } from '../config/config';

// Callbacks su 401 — la AuthProvider si registra qui per fare logout reattivo.
const unauthorizedListeners = new Set();
export const onUnauthorized = (cb) => {
  unauthorizedListeners.add(cb);
  return () => unauthorizedListeners.delete(cb);
};

const notifyUnauthorized = () => {
  unauthorizedListeners.forEach((cb) => {
    try { cb(); } catch { /* ignora */ }
  });
};

/**
 * Esegue una request HTTP. Ritorna sempre un oggetto risultato:
 *
 *   { ok, status, data, error, errorCode }
 *
 * - ok:        true se 2xx
 * - status:    codice HTTP (0 in caso di errore di rete)
 * - data:      body parsato come JSON (se possibile) oppure null
 * - error:     messaggio d'errore lato server o di rete, oppure null
 * - errorCode: campo `code` opzionale del backend (es. AuthErrorCodes)
 *
 * `auth` (default true) non aggiunge più header: il cookie viaggia sempre.
 * Serve solo a decidere se un 401 deve scatenare il logout globale.
 */
export const request = async (url, options = {}) => {
  const {
    method  = 'GET',
    body,
    headers = {},
    auth    = true,
    signal,
  } = options;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const finalHeaders = { ...headers };
  // Per FormData lasciamo che il browser imposti il Content-Type (con il boundary).
  if (body !== undefined && !isFormData) {
    finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json';
  }

  let response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
      credentials: 'include', // invia/riceve il cookie httpOnly access_token
      signal: signal || controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') return { ok: false, status: 0, data: null, error: 'Request timed out', errorCode: null };
    return { ok: false, status: 0, data: null, error: 'network_error', errorCode: null };
  }

  if (response.status === 401 && auth) {
    notifyUnauthorized();
  }

  let data = null;
  if (response.status !== 204) {
    try { data = await response.json(); } catch { /* body non JSON */ }
  }

  if (response.ok) {
    return { ok: true, status: response.status, data, error: null, errorCode: null };
  }

  return {
    ok: false,
    status: response.status,
    data,
    error: data?.error || `http_${response.status}`,
    errorCode: data?.code || null,
  };
};

/** Wrapper per servizi specifici: costruisce request a partire da un base URL. */
const createClient = (baseUrl) => ({
  get:    (path, opts)        => request(`${baseUrl}${path}`, { ...opts, method: 'GET' }),
  post:   (path, body, opts)  => request(`${baseUrl}${path}`, { ...opts, method: 'POST', body }),
  put:    (path, body, opts)  => request(`${baseUrl}${path}`, { ...opts, method: 'PUT', body }),
  patch:  (path, body, opts)  => request(`${baseUrl}${path}`, { ...opts, method: 'PATCH', body }),
  del:    (path, opts)        => request(`${baseUrl}${path}`, { ...opts, method: 'DELETE' }),
});

// Istanze pre-configurate per i tre microservizi.
export const authApi = createClient(getConfig('AUTH_SERVICE_URL'));
export const quizApi = createClient(getConfig('QUIZ_SERVICE_URL'));
export const userApi = createClient(getConfig('USER_SERVICE_URL'));
export const aiApi = createClient(getConfig('AI_SERVICE_URL'));
export const fileApi = createClient(getConfig('FILE_SERVICE_URL'));
