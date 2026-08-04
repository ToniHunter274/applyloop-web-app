import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import authService from '../services/authService';
import { getRoleHome, ROLE_DEMO_USERS, USER_ROLES } from '../config/roles';

const AuthContext = createContext(null);
const TOKEN_KEY = 'applyloopAuthToken';
const USER_KEY = 'applyloopUserData';
const LEGACY_TOKEN_KEY = 'orderlyAuthToken';
const LEGACY_USER_KEY = 'orderlyUserData';

const normalizeRole = (role) => Object.values(USER_ROLES).includes(role) ? role : USER_ROLES.USER_CLIENT;

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within an AuthProvider');
  return value;
};

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const persistSession = (nextUser, token = `demo_${Date.now()}`) => {
    if (typeof window === 'undefined') return;
    const normalizedUser = { ...nextUser, role: normalizeRole(nextUser?.role) };
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
    setUser(normalizedUser);
    setIsAuthenticated(true);
  };

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
        const rawUser = localStorage.getItem(USER_KEY) || localStorage.getItem(LEGACY_USER_KEY);
        if (token) {
          const parsedUser = rawUser ? JSON.parse(rawUser) : ROLE_DEMO_USERS[USER_ROLES.USER_CLIENT];
          persistSession({ ...parsedUser, role: normalizeRole(parsedUser?.role) }, token);
        }
      }
    } catch (sessionError) {
      console.error('Unable to restore ApplyLoop session:', sessionError);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    setError(null);
    setIsLoading(true);
    try {
      const selectedRole = normalizeRole(credentials?.role);
      let response;
      try {
        response = await authService.login(credentials);
      } catch {
        response = null;
      }
      const demoUser = ROLE_DEMO_USERS[selectedRole];
      const nextUser = {
        ...(response?.user || {}),
        ...demoUser,
        email: credentials?.email || demoUser.email,
        role: selectedRole,
      };
      persistSession(nextUser, response?.token);
      await router.push(getRoleHome(selectedRole));
      return { success: true, user: nextUser };
    } catch (loginError) {
      const message = loginError?.message || 'Unable to sign in.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => login({ role: USER_ROLES.USER_CLIENT, email: 'client@applyloop.com' });

  const signup = async (formData) => {
    setError(null);
    setIsLoading(true);
    try {
      const nextUser = {
        ...ROLE_DEMO_USERS[USER_ROLES.USER_CLIENT],
        name: formData?.name || ROLE_DEMO_USERS[USER_ROLES.USER_CLIENT].name,
        email: formData?.email || ROLE_DEMO_USERS[USER_ROLES.USER_CLIENT].email,
        phone: formData?.phone || '',
      };
      persistSession(nextUser);
      await router.push('/dashboard');
      return { success: true, user: nextUser };
    } catch (signupError) {
      const message = signupError?.message || 'Unable to create account.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (typeof window !== 'undefined') {
        [TOKEN_KEY, USER_KEY, LEGACY_TOKEN_KEY, LEGACY_USER_KEY, 'orderlyRefreshToken', 'applyloopRefreshToken'].forEach((key) => localStorage.removeItem(key));
      }
      setUser(null);
      setIsAuthenticated(false);
      await router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (role) => {
    const normalized = normalizeRole(role);
    const demoUser = ROLE_DEMO_USERS[normalized];
    persistSession({ ...demoUser, authProvider: 'demo' });
    await router.push(getRoleHome(normalized));
  };

  const updateProfile = async (profileData) => {
    const updatedUser = { ...user, ...profileData };
    persistSession(updatedUser, typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : undefined);
    return { success: true, user: updatedUser };
  };

  const changePassword = async () => ({ success: true });
  const requestPasswordReset = async () => ({ success: true, message: 'Password reset instructions have been sent.' });
  const resetPassword = async () => ({ success: true });
  const clearError = () => setError(null);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    loginWithGoogle,
    signup,
    logout,
    switchRole,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
