import { memo, useState, useRef, useEffect } from 'react';
import { FiBell, FiCheck, FiX, FiInfo, FiShoppingBag, FiUser, FiMessageSquare } from 'react-icons/fi';

const NotificationDropdown = memo(({ isOpen, onClose, notifications }) => {
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 animate-fadeIn z-50"
    >
      {/* Arrow pointing to the button */}
      <div className="absolute -top-2 right-4 w-4 h-4 bg-white transform rotate-45 border-t border-l border-gray-100"></div>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.map((notification, index) => (
          <div 
            key={index}
            className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="flex items-start">
              {/* Icon */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                notification.type === 'order' ? 'bg-blue-100' :
                notification.type === 'customer' ? 'bg-green-100' :
                'bg-purple-100'
              }`}>
                {notification.type === 'order' ? <FiShoppingBag className="text-blue-600" /> :
                 notification.type === 'customer' ? <FiUser className="text-green-600" /> :
                 <FiMessageSquare className="text-purple-600" />}
              </div>

              {/* Content */}
              <div className="ml-3 flex-1">
                <p className="text-sm text-gray-900">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
              </div>

              {/* Action Button */}
              <button className="flex-shrink-0 text-gray-400 hover:text-gray-500 transition-colors">
                <FiInfo className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center">
          View All Notifications
        </button>
      </div>
    </div>
  );
});

NotificationDropdown.displayName = 'NotificationDropdown';

export default NotificationDropdown; 