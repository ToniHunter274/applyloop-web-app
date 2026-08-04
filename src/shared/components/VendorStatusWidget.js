import React from 'react';
import { FiWifi, FiWifiOff, FiClock, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import { useVendorStatus } from '../hooks/useVendorStatus';
import { useRouter } from 'next/router';

/**
 * A widget that displays the vendor's online/offline status
 * and provides a button to toggle it
 */
const VendorStatusWidget = () => {
  const { isOnline, toggleVendorStatus, isApproved } = useVendorStatus();
  const router = useRouter();
  
  const handleProfileClick = () => {
    router.push('/my-profile');
  };

  // If the vendor is not approved yet
  if (!isApproved) {
    return (
      <div className="bg-orange-50 dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all duration-300 border-l-4 border-orange-500">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center mb-2">
              <FiAlertTriangle className="h-6 w-6 text-orange-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Account Awaiting Approval
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your vendor account is currently under review. You won&apos;t be able to go online and accept orders until your registration is approved.
            </p>
            
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <FiInfo className="mr-1" />
              <span>
                This usually takes 1-2 business days. Make sure your profile information is complete.
              </span>
            </div>
          </div>
          
          <button
            onClick={handleProfileClick}
            className="px-4 py-2 rounded-full font-medium text-white bg-orange-500 hover:bg-orange-600 transition-all duration-300 transform hover:scale-105"
          >
            View Profile
          </button>
        </div>
      </div>
    );
  }
  
  // For approved vendors
  return (
    <div className={`
      bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 
      transition-all duration-300 border-l-4 
      ${isOnline ? 'border-green-500' : 'border-red-500'}
    `}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center mb-2">
            {isOnline ? (
              <FiWifi className="h-6 w-6 text-green-500 mr-2" />
            ) : (
              <FiWifiOff className="h-6 w-6 text-red-500 mr-2" />
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              You are currently {isOnline ? 'Online' : 'Offline'}
            </h3>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {isOnline 
              ? 'You are accepting orders and visible to customers.' 
              : 'You are not accepting orders and hidden from customers.'}
          </p>
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <FiClock className="mr-1" />
            <span>
              {isOnline 
                ? 'Last went online: Today, 8:30 AM' 
                : 'Last went offline: Today, 6:45 PM'}
            </span>
          </div>
        </div>
        
        <button
          onClick={toggleVendorStatus}
          className={`
            px-4 py-2 rounded-full font-medium text-white 
            transition-all duration-300 transform hover:scale-105 
            ${isOnline 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-green-500 hover:bg-green-600'
            }
          `}
        >
          {isOnline ? 'Go Offline' : 'Go Online'}
        </button>
      </div>
      
      <div className={`
        mt-4 pt-4 border-t border-gray-200 dark:border-gray-700
        text-sm flex items-center justify-between
      `}>
        <div>
          <span className={`px-2 py-1 rounded-full ${isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {isOnline ? '10 pending orders' : 'No pending orders'}
          </span>
        </div>
        
        <button 
          onClick={handleProfileClick}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          View settings
        </button>
      </div>
    </div>
  );
};

export default VendorStatusWidget; 