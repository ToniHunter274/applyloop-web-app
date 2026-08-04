import React, { useState, useEffect } from 'react';
import { FiUpload, FiCamera, FiCheck, FiX, FiMapPin, FiPhone, FiMail, FiClock, FiEdit2, FiFacebook, FiTwitter, FiInstagram, FiImage } from 'react-icons/fi';
import SEO from '../shared/components/SEO';
import DashboardLayout from '../shared/components/DashboardLayout';
import { useVendorProfile } from '../shared/hooks/useVendorProfile';

// Demo profile data - will only be used if no saved profile exists and user chooses to load it
const demoProfileData = {
  name: 'Ahmed Adekunle',
  vendorName: 'Lagos Kitchen',
  email: 'ahmed@foodie.com',
  phone: '+234 810-123-4567',
  address: '42 Adeola Odeku Street, Ikeja, Lagos 100271',
  bio: 'Experienced restaurant manager with a passion for Nigerian cuisine and excellent customer service.',
  businessHours: {
    monday: { open: '09:00', close: '21:00', closed: false },
    tuesday: { open: '09:00', close: '21:00', closed: false },
    wednesday: { open: '09:00', close: '21:00', closed: false },
    thursday: { open: '09:00', close: '21:00', closed: false },
    friday: { open: '09:00', close: '22:00', closed: false },
    saturday: { open: '10:00', close: '22:00', closed: false },
    sunday: { open: '12:00', close: '20:00', closed: false }
  },
  specialties: ['Nigerian', 'West African', 'Jollof Rice', 'Suya'],
  profileImageUrl: '/avatars/ahmed.jpg',
  coverImageUrl: '/images/cover-placeholder.jpg',
  socialLinks: {
    facebook: 'https://facebook.com',
    twitter: 'https://twitter.com',
    instagram: 'https://instagram.com'
  },
  averageRating: 4.8,
  totalReviews: 124,
  memberSince: 'May 2022',
  verificationStatus: 'Verified'
};

export default function MyProfile() {
  // Get profile data from context
  const { profileData, updateProfile, defaultProfileData } = useVendorProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [specialty, setSpecialty] = useState('');
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [coverImagePreview, setCoverImagePreview] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [coverPosition, setCoverPosition] = useState('center');
  const [coverFit, setCoverFit] = useState('cover');

  // Prompt for demo data on first visit
  useEffect(() => {
    // Check if localStorage is available (only in browser)
    if (typeof window !== 'undefined' && isFirstVisit) {
      // If profile is empty, ask if they want demo data
      if (!profileData.name && !profileData.vendorName) {
        // First visit, ask if they want to use demo data or start fresh
        const useDemoData = window.confirm(
          "Would you like to load demo data to see how the profile looks when filled out? " +
          "Click 'OK' to use demo data or 'Cancel' to start with a blank profile."
        );
        
        if (useDemoData) {
          updateProfile(demoProfileData);
        }
      }
      setIsFirstVisit(false);
    }
  }, [isFirstVisit, profileData, updateProfile]);

  // Initialize form data from profile data
  useEffect(() => {
    setFormData(profileData);
    setProfileImagePreview(profileData.profileImageUrl);
    setCoverImagePreview(profileData.coverImageUrl);
    setCoverPosition(profileData.coverImagePosition || 'center');
    setCoverFit(profileData.coverImageFit || 'cover');
  }, [profileData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child, subchild] = name.split('.');
      if (subchild) {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [subchild]: value
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleToggleClosed = (day) => {
    setFormData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          closed: !prev.businessHours[day].closed
        }
      }
    }));
  };

  const handleAddSpecialty = () => {
    if (specialty.trim() && !formData.specialties?.includes(specialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...(prev.specialties || []), specialty.trim()]
      }));
      setSpecialty('');
    }
  };

  const handleRemoveSpecialty = (itemToRemove) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(item => item !== itemToRemove)
    }));
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
        setFormData(prev => ({ ...prev, profileImageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result);
        setFormData(prev => ({ ...prev, coverImageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverPositionChange = (position) => {
    setCoverPosition(position);
    setFormData(prev => ({
      ...prev,
      coverImagePosition: position
    }));
  };

  const handleCoverFitChange = (fit) => {
    setCoverFit(fit);
    setFormData(prev => ({
      ...prev,
      coverImageFit: fit
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.vendorName) newErrors.vendorName = 'Business name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.address) newErrors.address = 'Address is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Update profile data in the global context
    updateProfile(formData);
    setIsEditing(false);
    
    // Show success message
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const handleCancel = () => {
    // Reset form data to original profile data
    setFormData(profileData);
    setProfileImagePreview(profileData.profileImageUrl);
    setCoverImagePreview(profileData.coverImageUrl);
    setIsEditing(false);
  };

  return (
    <DashboardLayout>
      <SEO 
        title="My Profile" 
        description="Manage your vendor profile and business information" 
      />
      
      {/* Success message */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center z-50 animate-fadeIn shadow-lg">
          <FiCheck className="mr-2 text-green-600" /> 
          <span>Profile updated successfully!</span>
          <button onClick={() => setSaveSuccess(false)} className="ml-4 text-green-600 hover:text-green-800">
            <FiX />
          </button>
        </div>
      )}
      
      <div className="max-w-5xl mx-auto">
        {/* Cover Image */}
        <div className="relative h-80 rounded-lg overflow-hidden mb-8 bg-gradient-to-r from-blue-100 to-indigo-100 shadow-md">
          {coverImagePreview ? (
            <img 
              src={coverImagePreview} 
              alt="Cover" 
              className={`w-full h-full object-${coverFit} object-${coverPosition}`}
              style={{ objectPosition: coverPosition }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <FiImage className="h-16 w-16 text-gray-400 mb-2" />
              <p className="text-gray-500">No cover image uploaded</p>
            </div>
          )}
          
          {/* Semi-transparent overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          
          {/* Restaurant name overlay on the cover */}
          {!isEditing && profileData.vendorName && (
            <div className="absolute bottom-6 left-8 right-8">
              <h2 className="text-white text-3xl font-bold text-shadow-sm">{profileData.vendorName}</h2>
            </div>
          )}
          
          {/* Edit cover image button - more prominent and always visible */}
          {isEditing ? (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <label className="bg-blue-600 bg-opacity-90 text-white px-6 py-3 rounded-lg shadow-lg cursor-pointer hover:bg-blue-700 transition-colors flex items-center gap-2 transform hover:scale-105">
                  <FiCamera className="text-white h-5 w-5" />
                  <span>Change Cover Image</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleCoverImageChange}
                  />
                </label>
              </div>
              
              {/* Image adjustment controls */}
              {coverImagePreview && (
                <div className="absolute bottom-4 left-4 right-4 p-3 bg-black bg-opacity-70 rounded-lg z-20">
                  <div className="flex flex-col sm:flex-row gap-3 text-white">
                    <div>
                      <p className="text-xs font-medium mb-1">Image Position:</p>
                      <div className="flex gap-2">
                        {['top', 'center', 'bottom'].map(position => (
                          <button 
                            key={position}
                            onClick={() => handleCoverPositionChange(position)}
                            className={`px-2 py-1 rounded text-xs ${coverPosition === position ? 'bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'}`}>
                            {position.charAt(0).toUpperCase() + position.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1">Image Fit:</p>
                      <div className="flex gap-2">
                        {[
                          {value: 'cover', label: 'Cover'},
                          {value: 'contain', label: 'Contain'},
                          {value: 'fill', label: 'Fill'}
                        ].map(option => (
                          <button 
                            key={option.value}
                            onClick={() => handleCoverFitChange(option.value)}
                            className={`px-2 py-1 rounded text-xs ${coverFit === option.value ? 'bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'}`}>
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-black bg-opacity-50 text-white px-3 py-1.5 rounded-md text-sm">
                Edit profile to change cover image
              </div>
            </div>
          )}
        </div>
        
        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header Section with Profile Image */}
          <div className="relative p-8 pb-20 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
            <div className="flex justify-between">
              <div className="flex-grow">
                <h1 className="text-2xl font-bold text-gray-900">
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full p-3 border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900`}
                      placeholder="Your Full Name"
                    />
                  ) : (
                    profileData.name || 'Add Your Name'
                  )}
                </h1>
                
                <div className="text-lg text-gray-600 mt-1 flex items-center">
                  {isEditing ? (
                    <input
                      type="text"
                      name="vendorName"
                      value={formData.vendorName}
                      onChange={handleChange}
                      className={`w-full p-3 border ${errors.vendorName ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900`}
                      placeholder="Business Name"
                    />
                  ) : (
                    <span>{profileData.vendorName || 'Add Business Name'}</span>
                  )}
                </div>
                
                {!isEditing && (
                  <>
                    <div className="flex items-center mt-3">
                      <div className="flex text-yellow-400 mr-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg 
                            key={star} 
                            className={`h-5 w-5 ${star <= Math.round(profileData.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-gray-600">
                        {profileData.averageRating ? (
                          <>{profileData.averageRating} ({profileData.totalReviews} reviews)</>
                        ) : (
                          'No reviews yet'
                        )}
                      </span>
                    </div>
                  
                    <div className="mt-3 text-sm text-gray-500 flex items-center">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium mr-2 ${
                        profileData.verificationStatus === 'Verified' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {profileData.verificationStatus}
                      </div>
                      <span>Member since {profileData.memberSince}</span>
                    </div>
                  </>
                )}
              </div>
              
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"
                >
                  <FiEdit2 className="mr-2 -ml-1 h-4 w-4" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button 
                    onClick={handleCancel} 
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"
                  >
                    <FiX className="mr-2 -ml-1 h-4 w-4" />
                    Cancel
                  </button>
                  <button 
                    onClick={handleSubmit} 
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"
                  >
                    <FiCheck className="mr-2 -ml-1 h-4 w-4" />
                    Save
                  </button>
                </div>
              )}
            </div>
            
            {/* Profile Image */}
            <div className="absolute -bottom-14 left-8">
              <div className="relative inline-block">
                <div className="h-28 w-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                  <img 
                    src={profileImagePreview || '/images/profile-placeholder.jpg'} 
                    alt={formData.name || 'Profile'} 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors shadow-md">
                    <FiCamera className="text-white h-4 w-4" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-8 pt-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Left Column - Basic Info */}
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-6 pb-2 border-b border-gray-200">
                  Basic Information
                </h3>
                
                <div className="space-y-6">
                  {/* Contact Information */}
                  <div className="bg-gray-50 p-5 rounded-lg shadow-sm">
                    <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                      <span className="bg-blue-100 rounded-full p-1.5 mr-2">
                        <FiPhone className="text-blue-700 h-4 w-4" />
                      </span>
                      Contact Information
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <FiMail className="mt-2 text-gray-400 mr-3" />
                        {isEditing ? (
                          <div className="flex-grow">
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              className={`w-full p-3 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900`}
                              placeholder="Email Address"
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                          </div>
                        ) : (
                          <div className="text-gray-700">{profileData.email || 'Add Email Address'}</div>
                        )}
                      </div>
                      
                      <div className="flex items-start">
                        <FiPhone className="mt-2 text-gray-400 mr-3" />
                        {isEditing ? (
                          <div className="flex-grow">
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              className={`w-full p-3 border ${errors.phone ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900`}
                              placeholder="Phone Number"
                            />
                            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                          </div>
                        ) : (
                          <div className="text-gray-700">{profileData.phone || 'Add Phone Number'}</div>
                        )}
                      </div>
                      
                      <div className="flex items-start">
                        <FiMapPin className="mt-2 text-gray-400 mr-3" />
                        {isEditing ? (
                          <div className="flex-grow">
                            <textarea
                              name="address"
                              value={formData.address}
                              onChange={handleChange}
                              rows={3}
                              className={`w-full p-3 border ${errors.address ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900`}
                              placeholder="Full Address"
                            />
                            {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                          </div>
                        ) : (
                          <div className="text-gray-700">{profileData.address || 'Add Business Address'}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Bio */}
                  <div className="bg-gray-50 p-5 rounded-lg shadow-sm">
                    <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                      <span className="bg-green-100 rounded-full p-1.5 mr-2">
                        <FiEdit2 className="text-green-700 h-4 w-4" />
                      </span>
                      About
                    </h4>
                    
                    {isEditing ? (
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows={5}
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                        placeholder="Tell customers about your business, expertise, and what makes your food special..."
                      />
                    ) : (
                      <p className="text-gray-700">{profileData.bio || 'Add your business description'}</p>
                    )}
                  </div>
                  
                  {/* Specialties */}
                  <div className="bg-gray-50 p-5 rounded-lg shadow-sm">
                    <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                      <span className="bg-yellow-100 rounded-full p-1.5 mr-2">
                        <svg className="text-yellow-700 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </span>
                      Specialties
                    </h4>
                    
                    {isEditing && (
                      <div className="flex mb-4">
                        <input
                          type="text"
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                          className="flex-grow p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                          placeholder="Add a specialty (e.g., Jollof Rice)"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialty())}
                        />
                        <button
                          type="button"
                          onClick={handleAddSpecialty}
                          className="px-4 py-3 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition duration-150"
                        >
                          Add
                        </button>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      {formData.specialties && formData.specialties.length > 0 ? formData.specialties.map((item, index) => (
                        <div 
                          key={index} 
                          className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium flex items-center"
                        >
                          {item}
                          {isEditing && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSpecialty(item)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <FiX className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )) : (
                        <p className="text-gray-500 italic">No specialties added yet</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Social Links */}
                  {isEditing ? (
                    <div className="bg-gray-50 p-5 rounded-lg shadow-sm">
                      <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                        <span className="bg-purple-100 rounded-full p-1.5 mr-2">
                          <FiInstagram className="text-purple-700 h-4 w-4" />
                        </span>
                        Social Media Links
                      </h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <div className="bg-blue-600 p-2 rounded-l-md">
                            <FiFacebook className="text-white" />
                          </div>
                          <input
                            type="url"
                            name="socialLinks.facebook"
                            value={formData.socialLinks?.facebook || ''}
                            onChange={handleChange}
                            className="flex-grow p-3 border border-l-0 border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            placeholder="Facebook URL"
                          />
                        </div>
                        
                        <div className="flex items-center">
                          <div className="bg-blue-400 p-2 rounded-l-md">
                            <FiTwitter className="text-white" />
                          </div>
                          <input
                            type="url"
                            name="socialLinks.twitter"
                            value={formData.socialLinks?.twitter || ''}
                            onChange={handleChange}
                            className="flex-grow p-3 border border-l-0 border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            placeholder="Twitter URL"
                          />
                        </div>
                        
                        <div className="flex items-center">
                          <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-2 rounded-l-md">
                            <FiInstagram className="text-white" />
                          </div>
                          <input
                            type="url"
                            name="socialLinks.instagram"
                            value={formData.socialLinks?.instagram || ''}
                            onChange={handleChange}
                            className="flex-grow p-3 border border-l-0 border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            placeholder="Instagram URL"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (profileData.socialLinks?.facebook || profileData.socialLinks?.twitter || profileData.socialLinks?.instagram) && (
                    <div className="bg-gray-50 p-5 rounded-lg shadow-sm">
                      <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                        <span className="bg-purple-100 rounded-full p-1.5 mr-2">
                          <FiInstagram className="text-purple-700 h-4 w-4" />
                        </span>
                        Social Media
                      </h4>
                      
                      <div className="flex space-x-3">
                        {profileData.socialLinks?.facebook && (
                          <a href={profileData.socialLinks.facebook} target="_blank" rel="noopener noreferrer" 
                             className="bg-blue-600 p-2 rounded-full text-white hover:bg-blue-700 transition">
                            <FiFacebook />
                          </a>
                        )}
                        
                        {profileData.socialLinks?.twitter && (
                          <a href={profileData.socialLinks.twitter} target="_blank" rel="noopener noreferrer"
                             className="bg-blue-400 p-2 rounded-full text-white hover:bg-blue-500 transition">
                            <FiTwitter />
                          </a>
                        )}
                        
                        {profileData.socialLinks?.instagram && (
                          <a href={profileData.socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                             className="bg-gradient-to-r from-pink-500 to-purple-500 p-2 rounded-full text-white hover:from-pink-600 hover:to-purple-600 transition">
                            <FiInstagram />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right Column - Business Hours */}
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-6 pb-2 border-b border-gray-200">
                  Business Hours
                </h3>
                
                <div className="bg-gray-50 p-5 rounded-lg shadow-sm mb-6">
                  <div className="space-y-4">
                    {formData.businessHours && Object.entries(formData.businessHours).map(([day, hours]) => (
                      <div key={day} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100">
                        <div className="w-32 capitalize font-medium text-gray-700">
                          {day}
                        </div>
                        
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={hours.closed}
                                onChange={() => handleToggleClosed(day)}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <span className="ml-2 text-sm text-gray-600">Closed</span>
                            </label>
                            
                            {!hours.closed && (
                              <div className="flex items-center">
                                <input
                                  type="time"
                                  name={`businessHours.${day}.open`}
                                  value={hours.open}
                                  onChange={handleChange}
                                  className="w-32 p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                />
                                <span className="mx-2 text-sm text-gray-500">to</span>
                                <input
                                  type="time"
                                  name={`businessHours.${day}.close`}
                                  value={hours.close}
                                  onChange={handleChange}
                                  className="w-32 p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-700 font-medium">
                            {hours.closed ? (
                              <span className="text-red-500">Closed</span>
                            ) : (
                              <span className="bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">{hours.open} - {hours.close}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Map Preview */}
                {!isEditing && (
                  <div className="bg-gray-50 p-5 rounded-lg shadow-sm">
                    <h4 className="text-md font-medium text-gray-800 mb-4 flex items-center">
                      <span className="bg-green-100 rounded-full p-1.5 mr-2">
                        <FiMapPin className="text-green-700 h-4 w-4" />
                      </span>
                      Location
                    </h4>
                    <div className="bg-white h-64 rounded-lg overflow-hidden shadow-inner border border-gray-200">
                      {profileData.address ? (
                        <>
                          <img 
                            src="/images/map-placeholder.jpg" 
                            alt="Map location" 
                            className="w-full h-full object-cover" 
                          />
                          <div className="p-3 bg-white border-t border-gray-200">
                            <p className="text-sm text-gray-700">{profileData.address}</p>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-500">Add an address to display your location</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Help text at bottom */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This information will be displayed on your public profile page and will be visible to customers.</p>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              Complete your profile to attract more customers
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 