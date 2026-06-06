import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../auth/AuthContext';
import { request } from '../lib/apiClient';
import { server } from './msw/server';
import { FAKE_USER } from './msw/handlers';

const AUTH = 'http://localhost:5001';

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
  it('parte come non autenticato se /auth/me risponde 401', async () => {
    renderWithProvider();
    // Il controllo iniziale della sessione (GET /auth/me) è asincrono.
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('out'));
    expect(screen.getByTestId('username')).toHaveTextContent('-');
  });

  it('se /auth/me risponde con un utente, parte autenticato', async () => {
    server.use(http.get(`${AUTH}/auth/me`, () => HttpResponse.json(FAKE_USER)));
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('in'));
    expect(screen.getByTestId('username')).toHaveTextContent('alice');
  });

  it('login(user) popola lo stato user', async () => {
    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('out'));

    await act(async () => globalThis.__authActions.login(FAKE_USER));
    expect(screen.getByTestId('status')).toHaveTextContent('in');
    expect(screen.getByTestId('username')).toHaveTextContent('alice');
  });

  it('logout() chiama il backend e ripulisce lo stato', async () => {
    renderWithProvider();
    // Attendi che il controllo iniziale della sessione si concluda prima di login.
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('out'));
    await act(async () => globalThis.__authActions.login(FAKE_USER));
    expect(screen.getByTestId('status')).toHaveTextContent('in');

    await act(async () => globalThis.__authActions.logout());
    expect(screen.getByTestId('status')).toHaveTextContent('out');
  });

  it('una risposta 401 da apiClient esegue logout automatico', async () => {
    // Override handler con una risposta 401 a un endpoint qualsiasi
    server.use(
      http.get(`${AUTH}/health`, () =>
        HttpResponse.json({ error: 'unauth' }, { status: 401 })
      )
    );

    renderWithProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('out'));
    await act(async () => globalThis.__authActions.login(FAKE_USER));
    expect(screen.getByTestId('status')).toHaveTextContent('in');

    await act(async () => {
      await request(`${AUTH}/health`, { auth: true });
    });

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('out');
    });
  });
});
