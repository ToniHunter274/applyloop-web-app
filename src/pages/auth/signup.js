import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiPhone, FiFacebook, FiTwitter, FiAlertCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useTheme } from '../../shared/hooks/useTheme';
import { useAuth } from '../../shared/context/AuthContext';
import { initializeGoogleSignIn, renderGoogleButton } from '../../shared/utils/googleAuth';

export default function Signup() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { signup, loginWithGoogle, error } = useAuth();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const googleButtonRef = useRef(null);

  // Initialize Google Sign-In
  useEffect(() => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (googleClientId && googleButtonRef.current) {
      const handleGoogleResponse = async (response) => {
        try {
          setIsLoading(true);
          setSignupError('');
          
          const result = await loginWithGoogle(response);
          
          if (result.success) {
            console.log('Google authentication successful');
          } else {
            setSignupError(result.error || 'Google authentication failed');
          }
        } catch (error) {
          console.error('Google login error:', error);
          setSignupError(error.message || 'Google authentication failed');
        } finally {
          setIsLoading(false);
        }
      };

      initializeGoogleSignIn(handleGoogleResponse).then(() => {
        renderGoogleButton('google-signup-button');
      });
    }
  }, [loginWithGoogle]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    else if (!/^\+?[0-9\s\-()]{10,20}$/.test(formData.phone)) newErrors.phone = 'Please enter a valid phone number';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsLoading(true);
    setSignupError('');
    
    try {
      const userData = {
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      };
      
      const result = await signup(userData);
      
      if (result.success) {
        // Redirect to dashboard page after successful signup
        router.push('/dashboard');
      } else {
        setSignupError(result.error || 'Failed to create account');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setSignupError(err.message || 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up | ApplyLoop</title>
        <meta name="description" content="Create an ApplyLoop account" />
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 transition-colors duration-300">
        <div className="w-[494px] min-h-[612px] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[18px] shadow-2xl p-10 flex flex-col justify-between transition-all">
          {/* Header & Logo */}
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3">
              <img
                src="/logo.svg"
                alt="ApplyLoop Logo"
                className="w-10 h-10 rounded-full object-cover select-none"
              />
              <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                ApplyLoop
              </span>
            </div>
            
            <h2 className="text-3xl font-extrabold text-gray-955 dark:text-white tracking-tight">
              Get started for free
            </h2>
          </div>
          
          {/* Error Message */}
          {(signupError || error) && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 p-4 border border-red-100 dark:border-red-900/50 mt-4">
              <div className="flex">
                <FiAlertCircle className="h-5 w-5 text-red-500 mr-2.5 flex-shrink-0" />
                <span className="text-sm font-medium text-red-800 dark:text-red-300">
                  {signupError || error}
                </span>
              </div>
            </div>
          )}
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 my-auto pt-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                className={`block w-full px-4 py-3.5 border ${
                  formErrors.fullName 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-200 dark:border-gray-700 focus:ring-[#1E50C3] focus:border-transparent'
                } rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`}
                placeholder="John Doe"
              />
              {formErrors.fullName && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.fullName}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`block w-full px-4 py-3.5 border ${
                  formErrors.email 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-200 dark:border-gray-700 focus:ring-[#1E50C3] focus:border-transparent'
                } rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`}
                placeholder="banjidhevid216@gmail.com"
              />
              {formErrors.email && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className={`block w-full px-4 py-3.5 border ${
                  formErrors.phone 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-200 dark:border-gray-700 focus:ring-[#1E50C3] focus:border-transparent'
                } rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`}
                placeholder="+1 (123) 456-7890"
              />
              {formErrors.phone && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.phone}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full pl-4 pr-11 py-3.5 border ${
                    formErrors.password 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-200 dark:border-gray-700 focus:ring-[#1E50C3] focus:border-transparent'
                  } rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`}
                  placeholder="*********"
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none transition-colors"
                >
                  {isPasswordVisible ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.password}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={isPasswordVisible ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`block w-full px-4 py-3.5 border ${
                  formErrors.confirmPassword 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-200 dark:border-gray-700 focus:ring-[#1E50C3] focus:border-transparent'
                } rounded-xl bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`}
                placeholder="*********"
              />
              {formErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{formErrors.confirmPassword}</p>
              )}
            </div>

            <div className="flex items-center pt-2">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="h-4 w-4 text-[#1E50C3] focus:ring-[#1E50C3] border-gray-300 rounded-lg cursor-pointer"
              />
              <label htmlFor="agreeToTerms" className="ml-2 block text-xs text-gray-500 dark:text-gray-400 select-none">
                I agree to the <a href="#" className="text-[#1E50C3] hover:underline font-semibold">Terms</a> and <a href="#" className="text-[#1E50C3] hover:underline font-semibold">Privacy Policy</a>
              </label>
            </div>
            {formErrors.agreeToTerms && (
              <p className="text-xs text-red-600 dark:text-red-400">{formErrors.agreeToTerms}</p>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl text-white font-semibold bg-[#1E50C3] hover:bg-[#1A45A7] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E50C3] shadow-lg shadow-blue-500/10 dark:shadow-none hover:shadow-xl hover:shadow-blue-500/25 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>
          
          {/* Sign In link */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{' '}
              <Link 
                href="/auth/login" 
                className="font-bold text-[#1E50C3] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
} 