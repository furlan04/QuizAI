import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../auth/AuthContext';
import { request } from '../lib/apiClient';
import { server } from './msw/server';
import { FAKE_JWT } from './msw/handlers';

function AuthSpy() {
  const auth = useAuth();
  globalThis.__authActions = { login: auth.login, logout: auth.logout };
  return (
    <div>
      <span data-testid="status">{auth.isAuthenticated ? 'in' : 'out'}</span>
      <span data-testid="username">{auth.user?.username || '-'}</span>
    </div>
  );
}

const renderWithProvider = () =>
  render(
    <AuthProvider>
      <AuthSpy />
    </AuthProvider>
  );

describe('AuthContext', () => {
  it('parte come non autenticato se sessionStorage è vuoto', () => {
    renderWithProvider();
    expect(screen.getByTestId('status')).toHaveTextContent('out');
    expect(screen.getByTestId('username')).toHaveTextContent('-');
  });

  it('login(token) decodifica il JWT e popola lo stato user', async () => {
    renderWithProvider();
    await act(async () => globalThis.__authActions.login(FAKE_JWT));
    expect(screen.getByTestId('status')).toHaveTextContent('in');
    expect(screen.getByTestId('username')).toHaveTextContent('alice');
  });

  it('logout() ripulisce lo stato e il sessionStorage', async () => {
    renderWithProvider();
    await act(async () => globalThis.__authActions.login(FAKE_JWT));
    expect(sessionStorage.getItem('jwt')).toBe(FAKE_JWT);

    await act(async () => globalThis.__authActions.logout());
    expect(screen.getByTestId('status')).toHaveTextContent('out');
    expect(sessionStorage.getItem('jwt')).toBeNull();
  });

  it('una risposta 401 da apiClient esegue logout automatico', async () => {
    // Override handler con una risposta 401 a un endpoint qualsiasi
    server.use(
      http.get('http://localhost:5001/health', () =>
        HttpResponse.json({ error: 'unauth' }, { status: 401 })
      )
    );

    renderWithProvider();
    await act(async () => globalThis.__authActions.login(FAKE_JWT));
    expect(screen.getByTestId('status')).toHaveTextContent('in');

    await act(async () => {
      await request('http://localhost:5001/health', { auth: true });
    });

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('out');
    });
    expect(sessionStorage.getItem('jwt')).toBeNull();
  });
});
