// Google Authentication Helper Functions
// This file provides utility functions for working with Google Sign-In

// Google Client ID from environment variable
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/**
 * Load the Google Sign-In SDK
 * @returns {Promise<void>}
 */
export const loadGoogleScript = () => {
  return new Promise((resolve, reject) => {
    // If the script is already loaded, resolve immediately
    if (window.gapi) {
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (error) => reject(new Error('Failed to load Google Sign-In SDK'));
    
    // Add script to document
    document.head.appendChild(script);
  });
};

/**
 * Initialize Google Sign-In
 * @param {Function} callback - Callback function to handle the response
 * @returns {Promise<void>}
 */
export const initializeGoogleSignIn = async (callback) => {
  try {
    await loadGoogleScript();
    
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: callback,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    
    return true;
  } catch (error) {
    console.error('Google Sign-In initialization error:', error);
    return false;
  }
};

/**
 * Render Google Sign-In button
 * @param {string} elementId - ID of the element to render the button
 * @returns {void}
 */
export const renderGoogleButton = (elementId) => {
  if (!window.google || !GOOGLE_CLIENT_ID) return;
  
  window.google.accounts.id.renderButton(
    document.getElementById(elementId),
    {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: '100%',
    }
  );
};

/**
 * Prompt user for Google Sign-In
 * @returns {void}
 */
export const promptGoogleSignIn = () => {
  if (!window.google || !GOOGLE_CLIENT_ID) return;
  window.google.accounts.id.prompt();
};

/**
 * Sign out from Google
 * @returns {void}
 */
export const signOutGoogle = () => {
  if (!window.google || !GOOGLE_CLIENT_ID) return;
  window.google.accounts.id.disableAutoSelect();
};

/**
 * Parse JWT token payload
 * @param {string} token - JWT token
 * @returns {Object} - Decoded payload
 */
export const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT', error);
    return null;
  }
};

/**
 * Process Google credential response
 * @param {Object} response - Google credential response
 * @returns {Object} - Processed user data and token
 */
export const processGoogleResponse = (response) => {
  const { credential } = response;
  
  if (!credential) {
    throw new Error('No credential received from Google');
  }
  
  // Parse the JWT token to get user information
  const payload = parseJwt(credential);
  
  if (!payload) {
    throw new Error('Failed to parse Google credential');
  }
  
  // Extract user information
  const {
    sub: googleId,
    email,
    email_verified: emailVerified,
    name,
    given_name: givenName,
    family_name: familyName,
    picture: profilePicture,
  } = payload;
  
  return {
    idToken: credential,
    user: {
      googleId,
      email,
      emailVerified,
      name,
      givenName,
      familyName,
      profilePicture,
      authProvider: 'google',
    },
  };
};

export default {
  loadGoogleScript,
  initializeGoogleSignIn,
  renderGoogleButton,
  promptGoogleSignIn,
  signOutGoogle,
  parseJwt,
  processGoogleResponse,
}; 