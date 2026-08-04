import { useState, useCallback } from 'react';

/**
 * Hook for admin functionality related to vendor management
 */
export const useAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  /**
   * Approve a vendor's registration
   * @param {string} vendorId - The ID of the vendor to approve
   * @returns {Promise<Object>} - Response with success or error
   */
  const approveVendor = useCallback(async (vendorId) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real application, this would be an API call
      // For example:
      // const response = await fetch('/api/admin/vendors/approve', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ vendorId })
      // });
      
      // For demo purposes, we'll simulate a successful response
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update local storage for demo
      const vendors = JSON.parse(localStorage.getItem('orderlyVendors') || '[]');
      const updatedVendors = vendors.map(vendor => 
        vendor.id === vendorId 
          ? { ...vendor, verificationStatus: 'Approved' }
          : vendor
      );
      localStorage.setItem('orderlyVendors', JSON.stringify(updatedVendors));
      
      // Also update the current user if it's them being approved
      const currentUser = JSON.parse(localStorage.getItem('orderlyUserData') || '{}');
      if (currentUser.id === vendorId) {
        currentUser.verificationStatus = 'Approved';
        localStorage.setItem('orderlyUserData', JSON.stringify(currentUser));
      }
      
      setLoading(false);
      return { success: true, message: 'Vendor approved successfully' };
    } catch (err) {
      console.error('Error approving vendor:', err);
      setError('Failed to approve vendor. Please try again.');
      setLoading(false);
      return { success: false, error: 'Failed to approve vendor' };
    }
  }, []);
  
  /**
   * Reject a vendor's registration
   * @param {string} vendorId - The ID of the vendor to reject
   * @param {string} reason - The reason for rejection
   * @returns {Promise<Object>} - Response with success or error
   */
  const rejectVendor = useCallback(async (vendorId, reason) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real application, this would be an API call
      // For example:
      // const response = await fetch('/api/admin/vendors/reject', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ vendorId, reason })
      // });
      
      // For demo purposes, we'll simulate a successful response
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Update local storage for demo
      const vendors = JSON.parse(localStorage.getItem('orderlyVendors') || '[]');
      const updatedVendors = vendors.map(vendor => 
        vendor.id === vendorId 
          ? { ...vendor, verificationStatus: 'Rejected', rejectionReason: reason }
          : vendor
      );
      localStorage.setItem('orderlyVendors', JSON.stringify(updatedVendors));
      
      // Also update the current user if it's them being rejected
      const currentUser = JSON.parse(localStorage.getItem('orderlyUserData') || '{}');
      if (currentUser.id === vendorId) {
        currentUser.verificationStatus = 'Rejected';
        currentUser.rejectionReason = reason;
        localStorage.setItem('orderlyUserData', JSON.stringify(currentUser));
      }
      
      setLoading(false);
      return { success: true, message: 'Vendor rejected successfully' };
    } catch (err) {
      console.error('Error rejecting vendor:', err);
      setError('Failed to reject vendor. Please try again.');
      setLoading(false);
      return { success: false, error: 'Failed to reject vendor' };
    }
  }, []);
  
  /**
   * Get a list of all vendors with their approval status
   * @returns {Promise<Array>} - List of vendors
   */
  const getVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real application, this would be an API call
      // For example:
      // const response = await fetch('/api/admin/vendors');
      // const data = await response.json();
      
      // For demo purposes, we'll return mock data
      await new Promise(resolve => setTimeout(resolve, 800));
      const vendors = JSON.parse(localStorage.getItem('orderlyVendors') || '[]');
      
      setLoading(false);
      return vendors;
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError('Failed to fetch vendors. Please try again.');
      setLoading(false);
      return [];
    }
  }, []);
  
  return {
    approveVendor,
    rejectVendor,
    getVendors,
    loading,
    error
  };
};

export default useAdmin; 