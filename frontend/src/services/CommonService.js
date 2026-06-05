// I componenti React dovrebbero preferire `useAuth()` per leggere lo stato.
import { getToken } from '../lib/apiClient';

/** Decodifica il payload del JWT corrente. Ritorna null se non c'è. */
export const getCurrentUser = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { userId: payload.sub, email: payload.email, username: payload.username };
  } catch {
    return null;
  }
};
