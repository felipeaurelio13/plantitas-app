import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import AuthPage from '../../src/pages/Auth';
import useAuthStore from '../../src/stores/useAuthStore';

// Mock Firebase
const mockSignInWithEmailAndPassword = vi.fn();
const mockCreateUserWithEmailAndPassword = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChanged = vi.fn();
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();

vi.mock('../../src/lib/firebase', () => ({
  auth: {},
  db: {},
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  signOut: mockSignOut,
  onAuthStateChanged: mockOnAuthStateChanged,
  collection: mockCollection,
  doc: mockDoc,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
}));

// Helper component to wrap with router
const AuthPageWrapper = () => (
  <BrowserRouter>
    <AuthPage />
  </BrowserRouter>
);

describe('Firebase Authentication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useAuthStore.setState({
      user: null,
      initialized: false,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Login Flow', () => {
    it('should successfully log in a user with valid credentials', async () => {
      const user = userEvent.setup();
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com'
      };

      mockSignInWithEmailAndPassword.mockResolvedValueOnce({
        user: mockUser
      });

      render(<AuthPageWrapper />);

      // Should start in login mode by default
      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();

      // Fill in the form
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Verify Firebase was called
      await waitFor(() => {
        expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
          {},
          'test@example.com',
          'password123'
        );
      });
    });

    it('should display error message for invalid credentials', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Invalid email or password';

      mockSignInWithEmailAndPassword.mockRejectedValueOnce(new Error(errorMessage));

      render(<AuthPageWrapper />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should show loading state during login', async () => {
      const user = userEvent.setup();
      
      // Create a promise that won't resolve immediately
      let resolveLogin: any;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });
      mockSignInWithEmailAndPassword.mockReturnValueOnce(loginPromise);

      render(<AuthPageWrapper />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByRole('button', { name: /iniciando/i })).toBeDisabled();

      // Resolve the login
      resolveLogin({ user: { uid: 'test', email: 'test@example.com' } });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /iniciar sesión/i })).not.toBeDisabled();
      });
    });
  });

  describe('Registration Flow', () => {
    it('should successfully register a new user', async () => {
      const user = userEvent.setup();
      const mockUser = {
        uid: 'new-uid',
        email: 'newuser@example.com'
      };

      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({
        user: mockUser
      });
      mockCollection.mockReturnValue('profiles-collection');
      mockDoc.mockReturnValue('profile-doc-ref');
      mockSetDoc.mockResolvedValueOnce(undefined);

      render(<AuthPageWrapper />);

      // Switch to signup mode
      const switchToSignupButton = screen.getByText(/regístrate/i);
      await user.click(switchToSignupButton);

      expect(screen.getByText('Crear Cuenta')).toBeInTheDocument();

      // Fill in the signup form
      const fullNameInput = screen.getByPlaceholderText(/nombre completo/i);
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const confirmPasswordInput = screen.getByPlaceholderText(/confirmar contraseña/i);
      const submitButton = screen.getByRole('button', { name: /crear cuenta/i });

      await user.type(fullNameInput, 'Test User');
      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      // Verify Firebase was called
      await waitFor(() => {
        expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
          {},
          'newuser@example.com',
          'password123'
        );
        expect(mockSetDoc).toHaveBeenCalled();
      });
    });

    it('should validate password confirmation', async () => {
      const user = userEvent.setup();

      render(<AuthPageWrapper />);

      // Switch to signup mode
      const switchToSignupButton = screen.getByText(/regístrate/i);
      await user.click(switchToSignupButton);

      // Fill in the signup form with mismatched passwords
      const fullNameInput = screen.getByPlaceholderText(/nombre completo/i);
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const confirmPasswordInput = screen.getByPlaceholderText(/confirmar contraseña/i);
      const submitButton = screen.getByRole('button', { name: /crear cuenta/i });

      await user.type(fullNameInput, 'Test User');
      await user.type(emailInput, 'newuser@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'differentpassword');
      await user.click(submitButton);

      // Should show error and not call Firebase
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
      expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should handle registration errors', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Email already in use';

      mockCreateUserWithEmailAndPassword.mockRejectedValueOnce(new Error(errorMessage));

      render(<AuthPageWrapper />);

      // Switch to signup mode
      const switchToSignupButton = screen.getByText(/regístrate/i);
      await user.click(switchToSignupButton);

      // Fill in the signup form
      const fullNameInput = screen.getByPlaceholderText(/nombre completo/i);
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText('Contraseña');
      const confirmPasswordInput = screen.getByPlaceholderText(/confirmar contraseña/i);
      const submitButton = screen.getByRole('button', { name: /crear cuenta/i });

      await user.type(fullNameInput, 'Test User');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should require email and password for login', async () => {
      const user = userEvent.setup();

      render(<AuthPageWrapper />);

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
      await user.click(submitButton);

      // Should not call Firebase with empty fields
      expect(mockSignInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should require all fields for registration', async () => {
      const user = userEvent.setup();

      render(<AuthPageWrapper />);

      // Switch to signup mode
      const switchToSignupButton = screen.getByText(/regístrate/i);
      await user.click(switchToSignupButton);

      const submitButton = screen.getByRole('button', { name: /crear cuenta/i });
      await user.click(submitButton);

      // Should not call Firebase with empty fields
      expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();

      render(<AuthPageWrapper />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Browser should handle email validation
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });

  describe('Mode Switching', () => {
    it('should switch between login and signup modes', async () => {
      const user = userEvent.setup();

      render(<AuthPageWrapper />);

      // Should start in login mode
      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
      expect(screen.getByText(/¿no tienes cuenta\?/i)).toBeInTheDocument();

      // Switch to signup
      const switchToSignupButton = screen.getByText(/regístrate/i);
      await user.click(switchToSignupButton);

      expect(screen.getByText('Crear Cuenta')).toBeInTheDocument();
      expect(screen.getByText(/¿ya tienes cuenta\?/i)).toBeInTheDocument();

      // Switch back to login
      const switchToLoginButton = screen.getByText(/inicia sesión/i);
      await user.click(switchToLoginButton);

      expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
    });

    it('should clear errors when switching modes', async () => {
      const user = userEvent.setup();

      // Mock error on login
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(new Error('Login error'));

      render(<AuthPageWrapper />);

      // Trigger login error
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/contraseña/i);
      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Login error')).toBeInTheDocument();
      });

      // Switch to signup mode
      const switchToSignupButton = screen.getByText(/regístrate/i);
      await user.click(switchToSignupButton);

      // Error should be cleared
      expect(screen.queryByText('Login error')).not.toBeInTheDocument();
    });
  });
});