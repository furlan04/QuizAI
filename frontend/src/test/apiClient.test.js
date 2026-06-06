import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { request, onUnauthorized } from '../lib/apiClient';
import { server } from './msw/server';

describe('apiClient', () => {
  it('GET 2xx ritorna { ok:true, data, status, error:null }', async () => {
    server.use(
      http.get('http://localhost:8080/quizzes/1', () =>
        HttpResponse.json({ id: '1', title: 'Storia' })
      )
    );
    const res = await request('http://localhost:8080/quizzes/1', { auth: false });
    expect(res.ok).toBe(true);
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ id: '1', title: 'Storia' });
    expect(res.error).toBeNull();
  });

  it('4xx con body { error, code } popola errorCode e error', async () => {
    server.use(
      http.post('http://localhost:5001/auth/login', () =>
        HttpResponse.json({ error: 'Credenziali non valide.', code: 'invalid_credentials' }, { status: 401 })
      )
    );
    const res = await request('http://localhost:5001/auth/login', {
      method: 'POST',
      body: { email: 'a@b.com', password: 'x' },
      auth: false,
    });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(401);
    expect(res.error).toBe('Credenziali non valide.');
    expect(res.errorCode).toBe('invalid_credentials');
  });

  it('non aggiunge più l\'header Authorization: il cookie httpOnly viaggia da solo', async () => {
    let receivedAuth = 'sentinel';
    server.use(
      http.get('http://localhost:5001/me', ({ request: req }) => {
        receivedAuth = req.headers.get('authorization');
        return HttpResponse.json({ ok: true });
      })
    );
    await request('http://localhost:5001/me');
    expect(receivedAuth).toBeNull();
  });

  it('su 401 (auth=true) emette notify ai listener onUnauthorized', async () => {
    let fired = 0;
    const off = onUnauthorized(() => { fired++; });

    server.use(
      http.get('http://localhost:5001/protected', () =>
        HttpResponse.json({ error: 'nope' }, { status: 401 })
      )
    );
    await request('http://localhost:5001/protected');
    expect(fired).toBe(1);
    off();
  });

  it('errore di rete (host inesistente) ritorna { ok:false, status:0, error:"network_error" }', async () => {
    // MSW è configurato con onUnhandledRequest:'error' quindi non bypassiamo
    // la richiesta — invece usiamo un URL handled che lancia un error.
    server.use(
      http.get('http://localhost:8080/boom', () => HttpResponse.error())
    );
    const res = await request('http://localhost:8080/boom', { auth: false });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(0);
    expect(res.error).toBe('network_error');
  });
});
