import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useAuthStore from '../../../src/stores/useAuthStore';

// Mock Firebase
const mockSignInWithEmailAndPassword = vi.fn();
const mockCreateUserWithEmailAndPassword = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChanged = vi.fn();
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();

vi.mock('../../../src/lib/firebase', () => ({
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

describe('useAuthStore', () => {
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

  describe('Authentication Flow', () => {
    it('should initialize store with default state', () => {
      const { result } = renderHook(() => useAuthStore());
      
      expect(result.current.user).toBeNull();
      expect(result.current.initialized).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle successful sign in', async () => {
      const { result } = renderHook(() => useAuthStore());
      const email = 'test@example.com';
      const password = 'password123';

      mockSignInWithEmailAndPassword.mockResolvedValueOnce({
        user: { uid: 'test-uid', email }
      });

      await act(async () => {
        await result.current.signIn(email, password);
      });

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith({}, email, password);
      expect(result.current.error).toBeNull();
    });

    it('should handle sign in error', async () => {
      const { result } = renderHook(() => useAuthStore());
      const email = 'test@example.com';
      const password = 'wrongpassword';
      const errorMessage = 'Invalid credentials';

      mockSignInWithEmailAndPassword.mockRejectedValueOnce(new Error(errorMessage));

      await act(async () => {
        try {
          await result.current.signIn(email, password);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle successful sign up', async () => {
      const { result } = renderHook(() => useAuthStore());
      const email = 'newuser@example.com';
      const password = 'password123';
      const fullName = 'Test User';

      const mockUser = { uid: 'new-uid', email };
      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({
        user: mockUser
      });
      mockCollection.mockReturnValue('profiles-collection');
      mockDoc.mockReturnValue('profile-doc-ref');
      mockSetDoc.mockResolvedValueOnce(undefined);

      await act(async () => {
        await result.current.signUp(email, password, password, fullName);
      });

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith({}, email, password);
      expect(mockCollection).toHaveBeenCalledWith({}, 'profiles');
      expect(mockSetDoc).toHaveBeenCalled();
      expect(result.current.error).toBeNull();
    });

    it('should handle password mismatch in sign up', async () => {
      const { result } = renderHook(() => useAuthStore());
      const email = 'newuser@example.com';
      const password = 'password123';
      const confirmPassword = 'differentpassword';

      await act(async () => {
        try {
          await result.current.signUp(email, password, confirmPassword);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Passwords do not match');
      expect(mockCreateUserWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should handle successful sign out', async () => {
      const { result } = renderHook(() => useAuthStore());

      mockSignOut.mockResolvedValueOnce(undefined);

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSignOut).toHaveBeenCalledWith({});
      expect(result.current.error).toBeNull();
    });

    it('should clear error when clearError is called', () => {
      const { result } = renderHook(() => useAuthStore());

      // Set an error first
      act(() => {
        useAuthStore.setState({ error: 'Test error' });
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Auth State Management', () => {
    it('should handle auth state change with existing user profile', async () => {
      const mockUser = {
        uid: 'existing-uid',
        email: 'existing@example.com'
      };

      const mockProfileData = {
        id: 'existing-uid',
        email: 'existing@example.com',
        fullName: 'Existing User',
        avatarUrl: null,
        preferences: {}
      };

      mockCollection.mockReturnValue('profiles-collection');
      mockDoc.mockReturnValue('profile-doc-ref');
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockProfileData
      });

      // Mock onAuthStateChanged to call the callback immediately
      mockOnAuthStateChanged.mockImplementationOnce((auth, callback) => {
        callback(mockUser);
        return () => {}; // Return unsubscribe function
      });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.initialize();
      });

      // Wait for async operations
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.user).toEqual({
        id: 'existing-uid',
        ...mockProfileData
      });
      expect(result.current.initialized).toBe(true);
    });

    it('should handle auth state change with new user (no profile)', async () => {
      const mockUser = {
        uid: 'new-uid',
        email: 'new@example.com'
      };

      mockCollection.mockReturnValue('profiles-collection');
      mockDoc.mockReturnValue('profile-doc-ref');
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false
      });
      mockSetDoc.mockResolvedValueOnce(undefined);

      mockOnAuthStateChanged.mockImplementationOnce((auth, callback) => {
        callback(mockUser);
        return () => {};
      });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.initialize();
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockSetDoc).toHaveBeenCalled();
      expect(result.current.user).toEqual({
        id: 'new-uid',
        email: 'new@example.com',
        fullName: null,
        avatarUrl: null,
        preferences: {}
      });
      expect(result.current.initialized).toBe(true);
    });

    it('should handle auth state change when user signs out', () => {
      mockOnAuthStateChanged.mockImplementationOnce((auth, callback) => {
        callback(null); // No user
        return () => {};
      });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.initialize();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.initialized).toBe(true);
    });
  });

  describe('Loading States', () => {
    it('should set loading state during sign in', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Make the sign in promise pending
      let resolveSignIn: any;
      const signInPromise = new Promise((resolve) => {
        resolveSignIn = resolve;
      });
      mockSignInWithEmailAndPassword.mockReturnValueOnce(signInPromise);

      // Start sign in
      act(() => {
        result.current.signIn('test@example.com', 'password');
      });

      // Check loading state
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolveSignIn({ user: { uid: 'test', email: 'test@example.com' } });
        await signInPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should set loading state during sign up', async () => {
      const { result } = renderHook(() => useAuthStore());

      let resolveSignUp: any;
      const signUpPromise = new Promise((resolve) => {
        resolveSignUp = resolve;
      });
      mockCreateUserWithEmailAndPassword.mockReturnValueOnce(signUpPromise);
      mockCollection.mockReturnValue('profiles-collection');
      mockDoc.mockReturnValue('profile-doc-ref');
      mockSetDoc.mockResolvedValueOnce(undefined);

      act(() => {
        result.current.signUp('test@example.com', 'password');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignUp({ user: { uid: 'test', email: 'test@example.com' } });
        await signUpPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});