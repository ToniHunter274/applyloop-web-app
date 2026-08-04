import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FiUser, FiMail, FiMapPin, FiPhone, FiHome, FiInfo, FiImage, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../shared/context/AuthContext';
import { useVendorProfile } from '../shared/hooks/useVendorProfile';

export default function VendorRegistration() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { updateProfile } = useVendorProfile();
  
  const [formData, setFormData] = useState({
    vendorName: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    description: '',
    logo: null,
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      router.push('/auth/login');
    }
    
    // Pre-fill form with user data if available
    if (user && user.email) {
      setFormData(prev => ({
        ...prev,
        businessEmail: user.email,
      }));
    }
  }, [isAuthenticated, router, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, logo: file }));
      
      // Preview image
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const errors = {};
    
    if (!formData.vendorName) errors.vendorName = 'Business name is required';
    if (!formData.businessEmail) errors.businessEmail = 'Business email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.businessEmail)) errors.businessEmail = 'Email is invalid';
    if (!formData.businessPhone) errors.businessPhone = 'Business phone is required';
    if (!formData.businessAddress) errors.businessAddress = 'Business address is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsLoading(true);
    
    try {
      // Update the vendor profile
      updateProfile({
        vendorName: formData.vendorName,
        email: formData.businessEmail,
        phone: formData.businessPhone,
        address: formData.businessAddress,
        bio: formData.description,
        // In a real app, we would upload the logo and get a URL
        // For now, just use the preview URL
        profileImageUrl: logoPreview || '/images/profile-placeholder.jpg',
      });
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Vendor registration error:', error);
      setFormErrors({ submit: 'Failed to register vendor account. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Vendor Registration | Orderly</title>
        <meta name="description" content="Register your business on Orderly" />
      </Head>
      
      <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              Setup Your Vendor Account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Just a few more details to get you started as a vendor on Orderly
            </p>
          </div>
          
          {formErrors.submit && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{formErrors.submit}</h3>
                </div>
              </div>
            </div>
          )}
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              {/* Business Name */}
              <div>
                <label htmlFor="vendorName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Business Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiHome className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="vendorName"
                    name="vendorName"
                    type="text"
                    value={formData.vendorName}
                    onChange={handleChange}
                    placeholder="Your Restaurant or Business Name"
                    className={`appearance-none block w-full pl-10 pr-3 py-3 border ${
                      formErrors.vendorName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-xl shadow-sm placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2`}
                  />
                </div>
                {formErrors.vendorName && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.vendorName}</p>
                )}
              </div>

              {/* Business Email */}
              <div>
                <label htmlFor="businessEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Business Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="businessEmail"
                    name="businessEmail"
                    type="email"
                    value={formData.businessEmail}
                    onChange={handleChange}
                    placeholder="business@example.com"
                    className={`appearance-none block w-full pl-10 pr-3 py-3 border ${
                      formErrors.businessEmail ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-xl shadow-sm placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2`}
                  />
                </div>
                {formErrors.businessEmail && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.businessEmail}</p>
                )}
              </div>

              {/* Business Phone */}
              <div>
                <label htmlFor="businessPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Business Phone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="businessPhone"
                    name="businessPhone"
                    type="tel"
                    value={formData.businessPhone}
                    onChange={handleChange}
                    placeholder="+234 800 123 4567"
                    className={`appearance-none block w-full pl-10 pr-3 py-3 border ${
                      formErrors.businessPhone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-xl shadow-sm placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2`}
                  />
                </div>
                {formErrors.businessPhone && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.businessPhone}</p>
                )}
              </div>

              {/* Business Address */}
              <div>
                <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Business Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="businessAddress"
                    name="businessAddress"
                    type="text"
                    value={formData.businessAddress}
                    onChange={handleChange}
                    placeholder="123 Main Street, City, State"
                    className={`appearance-none block w-full pl-10 pr-3 py-3 border ${
                      formErrors.businessAddress ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-xl shadow-sm placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2`}
                  />
                </div>
                {formErrors.businessAddress && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.businessAddress}</p>
                )}
              </div>

              {/* Business Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Business Description (Optional)
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                    <FiInfo className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="description"
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Tell customers about your business..."
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 rounded-xl shadow-sm placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2"
                  />
                </div>
              </div>

              {/* Logo Upload */}
              <div>
                <label htmlFor="logo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Business Logo (Optional)
                </label>
                <div className="mt-1 flex flex-col items-center space-y-2">
                  {logoPreview && (
                    <div className="w-32 h-32 rounded-full overflow-hidden mb-2">
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <label 
                    htmlFor="logo-upload"
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                  >
                    <FiImage className="mr-2 h-5 w-5" />
                    {logoPreview ? 'Change Logo' : 'Upload Logo'}
                    <input
                      id="logo-upload"
                      name="logo"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleLogoChange}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                <span className="absolute right-4 inset-y-0 flex items-center">
                  <FiArrowRight className="h-5 w-5 text-blue-400 group-hover:text-blue-300" />
                </span>
                {isLoading ? 'Setting up your account...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
} 