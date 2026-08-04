import React, { createContext, useState, useContext, useEffect } from 'react';

// Default profile data structure
const defaultProfileData = {
  name: '',
  vendorName: '',
  email: '',
  phone: '',
  address: '',
  bio: '',
  businessHours: {
    monday: { open: '09:00', close: '21:00', closed: false },
    tuesday: { open: '09:00', close: '21:00', closed: false },
    wednesday: { open: '09:00', close: '21:00', closed: false },
    thursday: { open: '09:00', close: '21:00', closed: false },
    friday: { open: '09:00', close: '22:00', closed: false },
    saturday: { open: '10:00', close: '22:00', closed: false },
    sunday: { open: '12:00', close: '20:00', closed: false }
  },
  specialties: [],
  profileImageUrl: '/images/profile-placeholder.jpg',
  coverImageUrl: '/images/cover-placeholder.jpg',
  coverImagePosition: 'center',
  coverImageFit: 'cover',
  socialLinks: {
    facebook: '',
    twitter: '',
    instagram: ''
  },
  averageRating: 0,
  totalReviews: 0,
  memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  verificationStatus: 'Pending'
};

// Create the context
const VendorProfileContext = createContext();

// Provider component
export const VendorProfileProvider = ({ children }) => {
  const [profileData, setProfileData] = useState(defaultProfileData);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLoading(true);
      
      try {
        const savedProfile = localStorage.getItem('vendorProfile');
        
        if (savedProfile) {
          setProfileData(JSON.parse(savedProfile));
        }
      } catch (error) {
        console.error('Error loading vendor profile:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  // Update profile data and save to localStorage
  const updateProfile = (data) => {
    const updatedProfile = {
      ...profileData,
      ...data
    };
    
    setProfileData(updatedProfile);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('vendorProfile', JSON.stringify(updatedProfile));
    }
    
    return updatedProfile;
  };

  // Check if profile has been filled out
  const isProfileComplete = () => {
    return !!(
      profileData.name && 
      profileData.vendorName && 
      profileData.email && 
      profileData.phone && 
      profileData.address
    );
  };

  return (
    <VendorProfileContext.Provider 
      value={{ 
        profileData, 
        updateProfile, 
        isProfileComplete,
        isLoading,
        defaultProfileData
      }}
    >
      {children}
    </VendorProfileContext.Provider>
  );
};

// Custom hook to use the profile context
export const useVendorProfile = () => {
  const context = useContext(VendorProfileContext);
  
  if (context === undefined) {
    throw new Error('useVendorProfile must be used within a VendorProfileProvider');
  }
  
  return context;
}; 