import { http, HttpResponse } from 'msw';

const AUTH = 'http://localhost:5001';
const QUIZ = 'http://localhost:8080';
const USER = 'http://localhost:5002';

// Utente di prova restituito da login/me quando la sessione è valida.
export const FAKE_USER = { userId: 'user-1', username: 'alice', email: 'alice@test.com' };

// Handlers di default — risposte "happy path". I test li sovrascrivono con server.use(...) quando serve.
export const handlers = [
  // AUTH — il JWT viaggia come cookie httpOnly: il body contiene solo le info utente.
  http.post(`${AUTH}/auth/login`, async ({ request }) => {
    const body = await request.json();
    if (body.email === 'wrong@test.com') {
      return HttpResponse.json(
        { code: 'invalid_credentials', error: 'Credenziali non valide.' },
        { status: 401 }
      );
    }
    return HttpResponse.json({ ...FAKE_USER, email: body.email });
  }),

  // Sessione non valida di default: nessun cookie → 401. I test che simulano un
  // utente loggato sovrascrivono questo handler con server.use(...).
  http.get(`${AUTH}/auth/me`, () =>
    HttpResponse.json({ error: 'unauthorized' }, { status: 401 })
  ),

  http.post(`${AUTH}/auth/logout`, () => new HttpResponse(null, { status: 204 })),

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

  // NOTIFICATIONS
  http.get(`${USER}/users/me/notifications`, () =>
    HttpResponse.json([
      { id: 'n1', type: 'quiz_created', read: false, createdAt: new Date().toISOString(),
        actorId: 'u2', actorUsername: 'bob', quizId: 'q9', quizTitle: 'Geografia', friendshipId: null },
    ])
  ),
  http.get(`${USER}/users/me/notifications/unread-count`, () =>
    HttpResponse.json({ count: 1 })
  ),
  http.put(`${USER}/users/me/notifications/:id/read`, () => new HttpResponse(null, { status: 204 })),
  http.put(`${USER}/users/me/notifications/read-all`, () => new HttpResponse(null, { status: 204 })),
];
