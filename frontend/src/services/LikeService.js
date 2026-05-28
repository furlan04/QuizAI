import { handleNetworkError } from './CommonService';
import { getConfig } from '../config/config';
import { createAuthHeadersNoType } from './CommonService';

const API_URL = getConfig('API_ENDPOINT');

export const isLiked = async (postId, token) => {
  try {
    const response = await fetch(`${API_URL}/Like/${postId}`, {
        method: "GET",
        headers: createAuthHeadersNoType(token)
    });
    console.log(response);
    const data = await response.json();
    if (response.ok) {
        return { success: true, liked: data.isLiked };
    } else {
        return { success: false, message: data.message || "Errore durante il controllo del like" };
    }
    } catch (error) {
    return handleNetworkError(error);
    }
};

export const likePost = async (postId, token) => {
  try {
    const response = await fetch(`${API_URL}/Like/${postId}`, {
        method: "POST",
        headers: createAuthHeadersNoType(token)
    });
    const data = await response.json();
    if (response.ok) {
        return { success: true, ...data };
    } else {
        return { success: false, message: data.message || "Errore durante il like" };
    }
    } catch (error) {
    return handleNetworkError(error);
    }
};

export const unlikePost = async (postId, token) => {
    try {
        const response = await fetch(`${API_URL}/Like/${postId}`, {
            method: "DELETE",
            headers: createAuthHeadersNoType(token)
        });
        if (response.ok) {
            return { success: true };
        }
        else {
            return { success: false, message: "Errore durante l'unlike" };
        }
    } catch (error) {
        return handleNetworkError(error);
    }   
};