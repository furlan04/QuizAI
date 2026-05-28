// src/services/FriendshipService.js
import { handleHttpError, handleNetworkError, createAuthHeaders } from './CommonService';
import { getConfig } from '../config/config';

const API_URL = getConfig('API_ENDPOINT');

export const getFriendshipRequests = async (token) => {
  try {
    const response = await fetch(`${API_URL}/Friendship/requests`, {
      method: "GET",
      headers: createAuthHeaders(token)
    });

    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

export const sendFriendshipRequest = async (email, token) => {
  try {
    const response = await fetch(`${API_URL}/Friendship/send-request/${email}`, {
      method: "POST",
      headers: createAuthHeaders(token)
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorData = await response.json();
      throw new Error(errorData.message || "Errore nell'invio della richiesta");
    }
  } catch (error) {
    return handleNetworkError(error);
  }
};

export const acceptFriendshipRequest = async (friendshipId, token) => {
  try {
    const response = await fetch(`${API_URL}/Friendship/accept-request/${friendshipId}`, {
      method: "PUT",
      headers: createAuthHeaders(token)
    });

    if (response.ok) {
      return { success: true };
    } else {
      throw new Error("Errore nell'accettare la richiesta");
    }
  } catch (error) {
    return handleNetworkError(error);
  }
};

export const getFriendsList = async (token) => {
  try {
    const response = await fetch(`${API_URL}/Friendship/friend-list`, {
      method: "GET",
      headers: createAuthHeaders(token)
    });

    handleHttpError(response);
    return await response.json();
  } catch (error) {
    return handleNetworkError(error);
  }
};

export const removeFriendship = async (friendshipId, token) => {
  try {
    const response = await fetch(`${API_URL}/Friendship/remove-friendship/${friendshipId}`, {
      method: "DELETE",
      headers: createAuthHeaders(token)
    });

    if (response.ok) {
      return { success: true };
    } else {
      throw new Error("Errore nella rimozione dell'amicizia");
    }
  } catch (error) {
    return handleNetworkError(error);
  }
};