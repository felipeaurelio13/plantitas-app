import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useAuthStore from '../../src/stores/useAuthStore';

// Mock Firebase
const mockSignInWithEmailAndPassword = vi.fn();
const mockCreateUserWithEmailAndPassword = vi.fn();
const mockSignInWithPopup = vi.fn();
const mockSignOut = vi.fn();
const mockOnAuthStateChanged = vi.fn();
const mockCollection = vi.fn();
const mockDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();

// Mock Firebase user
const mockFirebaseUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
};

const mockUserProfile = {
  id: 'test-user-123',
  email: 'test@example.com',
  fullName: 'Test User',
  avatarUrl: null,
  preferences: {},
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

vi.mock('../../src/lib/firebase', () => ({
  auth: {},
  db: {},
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  signInWithPopup: mockSignInWithPopup,
  signOut: mockSignOut,
  onAuthStateChanged: mockOnAuthStateChanged,
  collection: mockCollection,
  doc: mockDoc,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  googleProvider: {},
  firestoreHelpers: {
    getCollection: vi.fn(),
    getDocRef: vi.fn(),
  },
}));

describe('Firebase Authentication Store', () => {
  beforeEach(() => {
    // Reset all mocks
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
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize without Firebase configured', () => {
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.initialize();
      });

      expect(result.current.initialized).toBe(true);
      expect(result.current.error).toBe('Firebase not configured');
    });

    it('should handle auth state changes with authenticated user', async () => {
      // Mock successful document retrieval
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockUserProfile,
      });

      mockDoc.mockReturnValueOnce('mock-doc-ref');

      const { result } = renderHook(() => useAuthStore());

      // Mock onAuthStateChanged to call the callback immediately
      mockOnAuthStateChanged.mockImplementationOnce((auth, callback) => {
        callback(mockFirebaseUser);
        return vi.fn(); // unsubscribe function
      });

      await act(async () => {
        result.current.initialize();
        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.user).toEqual({
        id: mockFirebaseUser.uid,
        ...mockUserProfile,
      });
      expect(result.current.initialized).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should create new user profile for first-time user', async () => {
      // Mock document doesn't exist
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
        data: () => null,
      });

      mockDoc.mockReturnValueOnce('mock-doc-ref');
      mockSetDoc.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuthStore());

      mockOnAuthStateChanged.mockImplementationOnce((auth, callback) => {
        callback(mockFirebaseUser);
        return vi.fn();
      });

      await act(async () => {
        result.current.initialize();
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(mockSetDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          id: mockFirebaseUser.uid,
          email: mockFirebaseUser.email,
          fullName: mockFirebaseUser.displayName,
          avatarUrl: mockFirebaseUser.photoURL,
          preferences: {},
        })
      );
    });

    it('should handle user sign out', async () => {
      const { result } = renderHook(() => useAuthStore());

      mockOnAuthStateChanged.mockImplementationOnce((auth, callback) => {
        callback(null); // null = signed out
        return vi.fn();
      });

      await act(async () => {
        result.current.initialize();
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.user).toBe(null);
      expect(result.current.initialized).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Sign In', () => {
    it('should sign in with email and password successfully', async () => {
      mockSignInWithEmailAndPassword.mockResolvedValueOnce({
        user: mockFirebaseUser,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        {},
        'test@example.com',
        'password123'
      );
      expect(result.current.error).toBe(null);
    });

    it('should handle sign in errors', async () => {
      const errorMessage = 'Invalid credentials';
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.signIn('test@example.com', 'wrongpassword');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
    });

    it('should throw error when Firebase not initialized', async () => {
      // Mock Firebase not available
      vi.mocked(vi.doMock('../../src/lib/firebase', () => ({
        auth: null,
      })));

      const { result } = renderHook(() => useAuthStore());

      await expect(
        result.current.signIn('test@example.com', 'password123')
      ).rejects.toThrow('Firebase auth not initialized');
    });
  });

  describe('Sign Up', () => {
    it('should sign up with email and password successfully', async () => {
      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({
        user: mockFirebaseUser,
      });
      mockDoc.mockReturnValueOnce('mock-doc-ref');
      mockSetDoc.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signUp(
          'test@example.com',
          'password123',
          'password123',
          'Test User'
        );
      });

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        {},
        'test@example.com',
        'password123'
      );
      expect(mockSetDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          id: mockFirebaseUser.uid,
          email: mockFirebaseUser.email,
          fullName: 'Test User',
        })
      );
    });

    it('should handle password mismatch', async () => {
      const { result } = renderHook(() => useAuthStore());

      await expect(
        result.current.signUp(
          'test@example.com',
          'password123',
          'differentpassword',
          'Test User'
        )
      ).rejects.toThrow('Passwords do not match');
    });

    it('should handle sign up errors', async () => {
      const errorMessage = 'Email already in use';
      mockCreateUserWithEmailAndPassword.mockRejectedValueOnce(
        new Error(errorMessage)
      );

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.signUp('test@example.com', 'password123');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Google Sign In', () => {
    it('should sign in with Google successfully', async () => {
      mockSignInWithPopup.mockResolvedValueOnce({
        user: mockFirebaseUser,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signInWithGoogle();
      });

      expect(mockSignInWithPopup).toHaveBeenCalledWith({}, {});
      expect(result.current.error).toBe(null);
    });

    it('should handle Google sign in errors', async () => {
      const errorMessage = 'Google sign in failed';
      mockSignInWithPopup.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.signInWithGoogle();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Sign Out', () => {
    it('should sign out successfully', async () => {
      mockSignOut.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockSignOut).toHaveBeenCalledWith({});
    });

    it('should handle sign out errors', async () => {
      const errorMessage = 'Sign out failed';
      mockSignOut.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.signOut();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Profile Update', () => {
    it('should update user profile successfully', async () => {
      mockDoc.mockReturnValueOnce('mock-doc-ref');
      mockSetDoc.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuthStore());

      // Set initial user state
      act(() => {
        useAuthStore.setState({ user: mockUserProfile });
      });

      const updates = { fullName: 'Updated Name' };

      await act(async () => {
        await result.current.updateProfile(updates);
      });

      expect(mockSetDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          ...updates,
          updatedAt: expect.any(String),
        }),
        { merge: true }
      );

      expect(result.current.user?.fullName).toBe('Updated Name');
    });

    it('should handle profile update errors', async () => {
      const errorMessage = 'Profile update failed';
      mockSetDoc.mockRejectedValueOnce(new Error(errorMessage));

      const { result } = renderHook(() => useAuthStore());

      // Set initial user state
      act(() => {
        useAuthStore.setState({ user: mockUserProfile });
      });

      await expect(
        result.current.updateProfile({ fullName: 'Updated Name' })
      ).rejects.toThrow(errorMessage);

      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Error Handling', () => {
    it('should clear errors', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({ error: 'Some error' });
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Loading States', () => {
    it('should manage loading state during sign in', async () => {
      mockSignInWithEmailAndPassword.mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(() => resolve({ user: mockFirebaseUser }), 100)
          )
      );

      const { result } = renderHook(() => useAuthStore());

      const signInPromise = act(async () => {
        return result.current.signIn('test@example.com', 'password123');
      });

      // Should be loading
      expect(result.current.isLoading).toBe(true);

      await signInPromise;

      // Should not be loading after completion
      expect(result.current.isLoading).toBe(false);
    });
  });
});