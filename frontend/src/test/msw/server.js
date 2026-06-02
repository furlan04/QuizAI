import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Server MSW per Node (Vitest). I test possono fare server.use(...) per override puntuali.
export const server = setupServer(...handlers);
