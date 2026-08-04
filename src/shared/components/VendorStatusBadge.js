import React from 'react';
import { FiWifi, FiWifiOff, FiClock } from 'react-icons/fi';
import { useVendorStatus } from '../hooks/useVendorStatus';

/**
 * A reusable component that displays the vendor's online/offline status
 * @param {Object} props Component props
 * @param {string} props.size - Size of the badge: 'sm', 'md', or 'lg'
 * @param {boolean} props.showText - Whether to show the text label
 * @param {boolean} props.showIcon - Whether to show the wifi icon
 * @param {string} props.className - Additional CSS classes
 */
const VendorStatusBadge = ({ 
  size = 'md', 
  showText = true, 
  showIcon = true,
  className = '' 
}) => {
  const { isOnline, isApproved } = useVendorStatus();
  
  // Configure sizes
  const sizeClasses = {
    sm: {
      container: 'px-1.5 py-0.5 text-xs',
      dot: 'h-1.5 w-1.5',
      icon: 'text-xs',
    },
    md: {
      container: 'px-2 py-1 text-sm',
      dot: 'h-2 w-2',
      icon: 'text-sm',
    },
    lg: {
      container: 'px-3 py-1.5 text-base',
      dot: 'h-2.5 w-2.5',
      icon: 'text-base',
    }
  };
  
  const selectedSize = sizeClasses[size] || sizeClasses.md;
  
  // Not approved state
  if (!isApproved) {
    return (
      <div 
        className={`inline-flex items-center rounded-full 
          bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400
          ${selectedSize.container} ${className}`}
      >
        {/* Animated dot */}
        <span 
          className={`${selectedSize.dot} rounded-full mr-1 bg-orange-500`}
        ></span>
        
        {/* Icon */}
        {showIcon && (
          <span className="mr-1">
            <FiClock className={selectedSize.icon} />
          </span>
        )}
        
        {/* Text label */}
        {showText && (
          <span className="font-medium">
            Pending
          </span>
        )}
      </div>
    );
  }
  
  // Approved state - show online/offline status
  return (
    <div 
      className={`inline-flex items-center rounded-full 
        ${isOnline 
          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
        } ${selectedSize.container} ${className}`}
    >
      {/* Animated dot */}
      <span 
        className={`${selectedSize.dot} rounded-full mr-1
          ${isOnline ? 'bg-green-500 animate-online' : 'bg-red-500 animate-offline'}`}
      ></span>
      
      {/* Icon */}
      {showIcon && (
        <span className="mr-1">
          {isOnline 
            ? <FiWifi className={selectedSize.icon} /> 
            : <FiWifiOff className={selectedSize.icon} />
          }
        </span>
      )}
      
      {/* Text label */}
      {showText && (
        <span className="font-medium">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
};

export default VendorStatusBadge; 