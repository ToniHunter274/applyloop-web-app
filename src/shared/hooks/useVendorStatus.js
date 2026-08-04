import React, { createContext, useState, useContext, useEffect } from 'react';
import { useVendorProfile } from './useVendorProfile';

// Create the context
const VendorStatusContext = createContext();

// Provider component
export const VendorStatusProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const { profileData } = useVendorProfile();

  // Check if vendor is approved based on profileData
  useEffect(() => {
    if (profileData && profileData.verificationStatus) {
      const isVendorApproved = profileData.verificationStatus.toLowerCase() === 'approved';
      setIsApproved(isVendorApproved);
      
      // If vendor loses approval, automatically set them offline
      if (!isVendorApproved && isOnline) {
        setIsOnline(false);
        if (typeof window !== 'undefined') {
          localStorage.setItem('orderlyVendorStatus', 'offline');
        }
      }
    }
  }, [profileData, isOnline]);

  // Load status from localStorage on mount, but only if approved
  useEffect(() => {
    if (typeof window !== 'undefined' && isApproved) {
      // Check localStorage
      const savedStatus = localStorage.getItem('orderlyVendorStatus');
      
      if (savedStatus) {
        setIsOnline(savedStatus === 'online');
      }
    }
  }, [isApproved]);

  // Save status to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('orderlyVendorStatus', isOnline ? 'online' : 'offline');
    }
  }, [isOnline]);

  // Toggle status function
  const toggleVendorStatus = () => {
    if (isApproved) {
      setIsOnline(prev => !prev);
    } else {
      console.warn('Cannot toggle vendor status: Account not approved');
      // You could implement a notification/alert here
    }
  };

  return (
    <VendorStatusContext.Provider 
      value={{ 
        isOnline, 
        toggleVendorStatus,
        isApproved
      }}
    >
      {children}
    </VendorStatusContext.Provider>
  );
};

// Custom hook to use the vendor status context
export const useVendorStatus = () => {
  const context = useContext(VendorStatusContext);
  
  if (context === undefined) {
    throw new Error('useVendorStatus must be used within a VendorStatusProvider');
  }
  
  return context;
}; 