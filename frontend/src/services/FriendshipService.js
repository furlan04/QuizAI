import { handleHttpError, handleNetworkError, createAuthHeaders } from './CommonService';
import { getConfig } from '../config/config';

const USER_URL = getConfig('USER_SERVICE_URL');

export const getFriendsList = async (token) => {
  try {
    const response = await fetch(`${USER_URL}/users/me/friends`, {
      headers: createAuthHeaders(token),
    });
    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

export const getFriendshipRequests = async (token) => {
  try {
    const response = await fetch(`${USER_URL}/users/me/friends/requests`, {
      headers: createAuthHeaders(token),
    });
    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

/** Invia richiesta di amicizia per username. */
export const sendFriendshipRequest = async (username, token) => {
  try {
    const response = await fetch(`${USER_URL}/users/me/friends/requests`, {
      method: 'POST',
      headers: createAuthHeaders(token),
      body: JSON.stringify({ username }),
    });
    const data = await response.json();
    if (response.ok) return { success: true, ...data };
    return { success: false, message: data.error || "Errore nell'invio della richiesta" };
  } catch (error) {
    return handleNetworkError(error);
  }
};

/** Accetta o rifiuta una richiesta. action: 'accept' | 'reject' */
export const respondFriendshipRequest = async (friendshipId, action, token) => {
  try {
    const response = await fetch(`${USER_URL}/users/me/friends/requests/${friendshipId}`, {
      method: 'PUT',
      headers: createAuthHeaders(token),
      body: JSON.stringify({ action }),
    });
    const data = await response.json();
    if (response.ok) return { success: true, ...data };
    return { success: false, message: data.error || "Errore nella risposta" };
  } catch (error) {
    return handleNetworkError(error);
  }
};

/** Alias compatibilità */
export const acceptFriendshipRequest = (friendshipId, token) =>
  respondFriendshipRequest(friendshipId, 'accept', token);

/**
 * Stato della relazione con un utente.
 * @returns { status: 'none'|'pending_sent'|'pending_received'|'accepted'|'self', friendshipId?: string }
 */
export const getFriendshipStatus = async (username, token) => {
  try {
    const response = await fetch(`${USER_URL}/users/me/friends/status/${encodeURIComponent(username)}`, {
      headers: createAuthHeaders(token),
    });
    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

export const removeFriendship = async (username, token) => {
  try {
    const response = await fetch(`${USER_URL}/users/me/friends/${username}`, {
      method: 'DELETE',
      headers: createAuthHeaders(token),
    });
    if (response.ok) return { success: true };
    return { success: false, message: "Errore nella rimozione dell'amicizia" };
  } catch (error) {
    return handleNetworkError(error);
  }
};
