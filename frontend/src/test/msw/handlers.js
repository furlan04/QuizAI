import { http, HttpResponse } from 'msw';

const AUTH = 'http://localhost:5001';
const QUIZ = 'http://localhost:8080';
const USER = 'http://localhost:5002';

// JWT fake con un payload base — usato dai test per simulare un utente loggato.
// Header e signature sono stub; AuthContext li accetta perché decodifica solo il payload.
const fakePayload = {
  sub: 'user-1',
  email: 'alice@test.com',
  username: 'alice',
  exp: Math.floor(Date.now() / 1000) + 3600,
};
export const FAKE_JWT = 'h.' + btoa(JSON.stringify(fakePayload)) + '.s';

// Handlers di default — risposte "happy path". I test li sovrascrivono con server.use(...) quando serve.
export const handlers = [
  // AUTH
  http.post(`${AUTH}/auth/login`, async ({ request }) => {
    const body = await request.json();
    if (body.email === 'wrong@test.com') {
      return HttpResponse.json(
        { code: 'invalid_credentials', error: 'Credenziali non valide.' },
        { status: 401 }
      );
    }
    return HttpResponse.json({
      userId: 'user-1', username: 'alice', email: body.email,
      token: FAKE_JWT, expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    });
  }),

  // QUIZ
  http.get(`${QUIZ}/quizzes`, () =>
    HttpResponse.json({
      items: [
        { id: 'q1', title: 'Quiz Storia', topic: 'Storia', difficulty: 'easy',
          numQuestions: 5, tags: ['storia'], createdBy: 'u1',
          createdByUsername: 'creator', createdAt: new Date().toISOString() },
      ],
      total: 1, page: 1, pageSize: 20,
    })
  ),

  // USER
  http.get(`${USER}/users/me`, () =>
    HttpResponse.json({
      id: 'user-1', username: 'alice', email: 'alice@test.com', bio: null, avatarUrl: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    })
  ),
];
