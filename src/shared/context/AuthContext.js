import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/router';
import { createClient } from '../../lib/supabase/client';
import { getRoleHome, USER_ROLES } from '../config/roles';

const AuthContext = createContext(null);
const validRoles = new Set(Object.values(USER_ROLES));

const removeDemoSession = () => {
  if (typeof window === 'undefined') return;

  [
    'applyloopAuthToken',
    'applyloopUserData',
    'applyloopRefreshToken',
    'orderlyAuthToken',
    'orderlyUserData',
    'orderlyRefreshToken',
  ].forEach((key) => localStorage.removeItem(key));
};

const formatUser = (authUser, profile) => ({
  id: authUser.id,
  email: profile.email || authUser.email,
  name: profile.full_name,
  phone: profile.phone || '',
  country: profile.country || '',
  timezone: profile.timezone || '',
  emailNotifications: profile.email_notifications ?? true,
  pushNotifications: profile.push_notifications ?? false,
  role: profile.role,
  accountStatus: profile.account_status,
  createdAt: profile.created_at,
  updatedAt: profile.updated_at,
});

export const useAuth = () => {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return value;
};

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const clearSession = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setIsPasswordRecovery(false);
  }, []);

  const loadUserProfile = useCallback(async (authUser) => {
    const supabase = createClient();

    if (!supabase || !authUser) {
      throw new Error('Unable to load your account.');
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(
        'id, email, full_name, phone, country, timezone, email_notifications, push_notifications, role, account_status, created_at, updated_at'
      )
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      throw new Error(
        'Your ApplyLoop profile could not be found. Contact an administrator.'
      );
    }

    if (!validRoles.has(profile.role)) {
      throw new Error('Your account does not have a valid workspace role.');
    }

    if (profile.account_status !== 'active') {
      throw new Error(
        'Your account is not active. Contact an ApplyLoop administrator.'
      );
    }

    const nextUser = formatUser(authUser, profile);

    setUser(nextUser);
    setIsAuthenticated(true);

    return nextUser;
  }, []);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    removeDemoSession();

    if (!supabase) {
      setIsLoading(false);
      return undefined;
    }

    const restoreSession = async () => {
      try {
        const {
          data: { user: authUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (userError || !authUser) {
          clearSession();
          return;
        }

        await loadUserProfile(authUser);
      } catch (sessionError) {
        if (!mounted) return;

        setError(sessionError.message);
        clearSession();
        await supabase.auth.signOut();
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !session?.user) {
        clearSession();
        setIsLoading(false);
        return;
      }

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }

      if (
        event === 'SIGNED_IN' ||
        event === 'PASSWORD_RECOVERY' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        window.setTimeout(() => {
          loadUserProfile(session.user)
            .catch(async (profileError) => {
              setError(profileError.message);
              clearSession();
              await supabase.auth.signOut();
            })
            .finally(() => {
              if (mounted) {
                setIsLoading(false);
              }
            });
        }, 0);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [clearSession, loadUserProfile]);

  const login = async ({ email, password }) => {
    setError(null);
    setIsPasswordRecovery(false);
    setIsLoading(true);

    try {
      const supabase = createClient();

      const {
        data,
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (loginError || !data.user) {
        throw new Error('The email address or password is incorrect.');
      }

      let nextUser;

      try {
        nextUser = await loadUserProfile(data.user);
      } catch (profileError) {
        await supabase.auth.signOut();
        throw profileError;
      }

      await router.replace(getRoleHome(nextUser.role));

      return {
        success: true,
        user: nextUser,
      };
    } catch (loginError) {
      const message =
        loginError?.message || 'Unable to sign in to ApplyLoop.';

      setError(message);
      clearSession();

      return {
        success: false,
        error: message,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    setIsLoading(true);

    let logoutError = null;
    let supabase;

    try {
      supabase = createClient();

      const { error } = await supabase.auth.signOut();

      if (error) {
        logoutError = error;

        await supabase.auth.signOut({
          scope: 'local',
        });
      }
    } catch (signOutError) {
      logoutError = signOutError;

      if (supabase) {
        try {
          await supabase.auth.signOut({
            scope: 'local',
          });
        } catch (localSignOutError) {
          logoutError = logoutError || localSignOutError;
        }
      }
    } finally {
      clearSession();
      setIsLoading(false);
    }

    await router.replace('/auth/login');

    if (logoutError) {
      return {
        success: false,
        error:
          'You were signed out on this device, but the remote session could not be revoked.',
      };
    }

    return { success: true };
  };

  const updateProfile = async (profileData) => {
    setError(null);

    try {
      if (!user?.id) {
        throw new Error('You must be signed in to update your profile.');
      }

      const changes = profileData || {};

      const fullName =
        changes.name?.trim() ||
        [changes.firstName, changes.lastName]
          .filter(Boolean)
          .join(' ')
          .trim();

      if (!fullName) {
        throw new Error('Enter your full name.');
      }

      const profileUpdates = {
        full_name: fullName,
      };

      if (Object.prototype.hasOwnProperty.call(changes, 'phone')) {
        profileUpdates.phone = changes.phone?.trim() || null;
      }

      if (Object.prototype.hasOwnProperty.call(changes, 'country')) {
        profileUpdates.country = changes.country?.trim() || null;
      }

      if (Object.prototype.hasOwnProperty.call(changes, 'timezone')) {
        profileUpdates.timezone = changes.timezone?.trim() || null;
      }

      if (Object.prototype.hasOwnProperty.call(changes, 'emailNotifications')) {
        profileUpdates.email_notifications = Boolean(changes.emailNotifications);
      }

      if (Object.prototype.hasOwnProperty.call(changes, 'pushNotifications')) {
        profileUpdates.push_notifications = Boolean(changes.pushNotifications);
      }

      const supabase = createClient();

      const { data: profile, error: updateError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id)
        .select(
          'id, email, full_name, phone, country, timezone, email_notifications, push_notifications, role, account_status, created_at, updated_at'
        )
        .single();

      if (updateError) {
        throw updateError;
      }

      const updatedUser = {
        ...user,
        name: profile.full_name,
        phone: profile.phone || '',
        country: profile.country || '',
        timezone: profile.timezone || '',
        emailNotifications: profile.email_notifications ?? true,
        pushNotifications: profile.push_notifications ?? false,
        updatedAt: profile.updated_at,
      };

      setUser(updatedUser);

      return {
        success: true,
        user: updatedUser,
      };
    } catch (profileError) {
      const message =
        profileError?.message || 'Unable to update your profile.';

      setError(message);

      return {
        success: false,
        error: message,
      };
    }
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    setError(null);

    try {
      if (!user?.email) {
        throw new Error('You must be signed in to change your password.');
      }

      if (!currentPassword) {
        throw new Error('Enter your current password.');
      }

      if (!newPassword || newPassword.length < 8) {
        throw new Error('Your new password must contain at least 8 characters.');
      }

      const supabase = createClient();

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError || signInData.user?.id !== user.id) {
        throw new Error('Your current password is incorrect.');
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      return {
        success: true,
        message: 'Your password has been updated.',
      };
    } catch (passwordError) {
      const message = passwordError?.message || 'Unable to update your password.';
      setError(message);
      return { success: false, error: message };
    }
  };

  const requestPasswordReset = async (email) => {
    setError(null);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/reset-password`;

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          { redirectTo }
        );

      if (resetError) {
        throw resetError;
      }

      return {
        success: true,
        message:
          'Password reset instructions have been sent if the account exists.',
      };
    } catch (resetError) {
      const message =
        resetError?.message ||
        'Unable to send password reset instructions.';

      setError(message);

      return {
        success: false,
        error: message,
      };
    }
  };

  const resetPassword = async ({ newPassword }) => {
    setError(null);

    try {
      if (!isPasswordRecovery) {
        throw new Error(
          'This password-reset link is invalid or has expired.'
        );
      }

      if (!newPassword || newPassword.length < 8) {
        throw new Error(
          'Your new password must contain at least 8 characters.'
        );
      }

      const supabase = createClient();

      const { error: updateError } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (updateError) {
        throw updateError;
      }

      return {
        success: true,
        message: 'Your password has been updated.',
      };
    } catch (passwordError) {
      const message =
        passwordError?.message || 'Unable to update your password.';

      setError(message);

      return {
        success: false,
        error: message,
      };
    }
  };

  const signup = async () => ({
    success: false,
    error: 'ApplyLoop accounts are created by an administrator.',
  });

  const loginWithGoogle = async () => ({
    success: false,
    error: 'Google sign-in is not enabled.',
  });

  const switchRole = async () => ({
    success: false,
    error: 'Workspace roles can only be changed by an administrator.',
  });

  const clearError = () => setError(null);

  const value = {
    user,
    isAuthenticated,
    isPasswordRecovery,
    isLoading,
    error,
    login,
    logout,
    signup,
    loginWithGoogle,
    switchRole,
    updateProfile,
    changePassword,
    requestPasswordReset,
    resetPassword,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
