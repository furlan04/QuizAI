import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import { AuthProvider } from '../auth/AuthContext';

const Stub = ({ label }) => <div data-testid={`page-${label}`}>{label}</div>;

const renderLogin = (initialEntry = '/login') =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Stub label="home" />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );

describe('LoginPage', () => {
  it('mostra il form con i campi email e password', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accedi/i })).toBeInTheDocument();
  });

  it('login con credenziali valide naviga a / (cookie impostato dal server)', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'alice@test.com');
    await user.type(screen.getByLabelText(/password/i), 'secret123');
    await user.click(screen.getByRole('button', { name: /accedi/i }));

    await waitFor(() => {
      expect(screen.getByTestId('page-home')).toBeInTheDocument();
    });
  });

  it('login con credenziali sbagliate mostra il messaggio d\'errore', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'wrong@test.com');
    await user.type(screen.getByLabelText(/password/i), 'xxx');
    await user.click(screen.getByRole('button', { name: /accedi/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/email o password non corretti/i);
    });
  });
});
