import { memo, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FiUser, 
  FiSettings, 
  FiHelpCircle, 
  FiLogOut, 
  FiMail, 
  FiPhone,
  FiShield,
  FiStar,
  FiMoon,
  FiSun,
  FiWifi,
  FiWifiOff,
  FiClock
} from 'react-icons/fi';
import { useTheme } from '../hooks/useTheme';
import { useVendorStatus } from '../hooks/useVendorStatus';
import { useRouter } from 'next/router';

const ProfileDropdown = memo(({ isOpen, onClose, userData = {}, onLogout }) => {
  const router = useRouter();
  const dropdownRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const { isOnline, toggleVendorStatus, isApproved } = useVendorStatus();
  
  // Default user data if not provided
  const {
    name = 'Ahmed Adekunle',
    email = 'ahmed@example.com',
    role = 'Restaurant Manager',
    avatar = 'https://randomuser.me/api/portraits/men/32.jpg',
    phone = '+234 810-123-4567',
    accountStatus = 'Verified',
    memberSince = 'May 2022',
    rating = 4.8
  } = userData;

  // Close dropdown when clicking outside
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }

    return () => {};
  }, [isOpen, onClose]);

  const handleLogout = (e) => {
    e.preventDefault();
    
    if (onLogout) {
      onLogout();
    }
    
    onClose();
  };

  if (!isOpen) return null;

  // Menu items for profile dropdown
  const menuItems = [
    { icon: <FiUser className="text-blue-600" />, label: 'My Profile', href: '/my-profile' },
    { icon: <FiSettings className="text-gray-600" />, label: 'Account Settings', href: '#settings' },
    { icon: <FiShield className="text-green-600" />, label: 'Privacy & Security', href: '#privacy' },
    { icon: <FiStar className="text-yellow-500" />, label: 'My Reviews', href: '#reviews' },
    { icon: <FiHelpCircle className="text-purple-600" />, label: 'Help & Support', href: '#support' },
    { 
      icon: isDarkMode ? (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-400/20">
          <FiSun className="text-amber-400 animate-sun" />
        </div>
      ) : (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-400/20">
          <FiMoon className="text-indigo-600 animate-moon" />
        </div>
      ), 
      label: isDarkMode ? 'Light Mode' : 'Dark Mode', 
      href: '#', 
      onClick: (e) => {
        e.preventDefault();
        toggleTheme();
      },
      rightElement: (
        <div className="ml-auto">
          <div className={`w-11 h-6 flex items-center rounded-full p-1 ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}>
            <div 
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                isDarkMode ? 'translate-x-5' : 'translate-x-0'
              }`} 
            />
          </div>
        </div>
      )
    },
    ...(isApproved ? [{
      icon: isOnline ? (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-400/20">
          <FiWifi className="text-green-500 animate-online" />
        </div>
      ) : (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-400/20">
          <FiWifiOff className="text-red-500 animate-offline" />
        </div>
      ), 
      label: isOnline ? 'Online - Accepting Orders' : 'Offline - Not Accepting Orders', 
      href: '#', 
      onClick: (e) => {
        e.preventDefault();
        toggleVendorStatus();
      },
      rightElement: (
        <div className="ml-auto">
          <div className={`w-11 h-6 flex items-center rounded-full p-1 ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}>
            <div 
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                isOnline ? 'translate-x-5' : 'translate-x-0'
              }`} 
            />
          </div>
        </div>
      )
    }] : [{
      icon: (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-400/20">
          <FiClock className="text-orange-500" />
        </div>
      ),
      label: 'Pending Approval - Cannot Go Online',
      href: '/my-profile',
      onClick: (e) => {
        e.preventDefault();
        router.push('/my-profile');
      },
      rightElement: (
        <div className="ml-auto">
          <div className="w-11 h-6 flex items-center rounded-full p-1 bg-gray-300">
            <div className="bg-white w-4 h-4 rounded-full shadow-md transform" />
          </div>
        </div>
      )
    }]),
    { 
      icon: <FiLogOut className="text-red-500" />, 
      label: 'Logout', 
      href: '#logout', 
      divider: true,
      onClick: handleLogout
    }
  ];

  return (
    <div 
      ref={dropdownRef}
      className={`absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100/40 dark:border-gray-700/40 backdrop-blur-sm z-50 
        ${isAnimating ? 'animate-dropdownEnter' : ''}`}
      style={{
        transformOrigin: 'top right'
      }}
    >
      {/* Arrow pointing to the button */}
      <div className="absolute -top-2 right-4 w-4 h-4 bg-white dark:bg-gray-800 transform rotate-45 border-t border-l border-gray-100/40 dark:border-gray-700/40 shadow-[-3px_-3px_5px_rgb(0,0,0,0.02)]"></div>
      
      {/* User Profile Header */}
      <div className="relative pt-6 pb-12 px-4 text-center rounded-t-lg overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 opacity-90"></div>
        
        {/* Profile Picture */}
        <div className="relative mb-14">
          <div className="relative inline-block">
            <img 
              src={avatar} 
              alt={name} 
              className="w-20 h-20 rounded-full border-4 border-white shadow-md object-cover"
              onError={(e) => {
                if (typeof window !== 'undefined') {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=random`;
                }
              }}
            />
          </div>
          
          {/* Name and Role */}
          <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-full">
            <h3 className="text-lg font-bold text-white mb-1">{name}</h3>
            <p className="text-xs text-white/80 mb-1">{role}</p>
            <div className="flex items-center justify-center gap-3 mt-2">
              <div className="bg-yellow-400/20 backdrop-blur-sm rounded-full px-2 py-1 text-white/90 flex items-center text-xs">
                <FiStar className="mr-1 h-3 w-3" />
                {rating}
              </div>
              <div className="bg-green-400/20 backdrop-blur-sm rounded-full px-2 py-1 text-white/90 text-xs">
                {accountStatus}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Contact Details */}
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-300 mb-2">
          <FiMail className="mr-2 h-3 w-3" />
          {email}
        </div>
        <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
          <FiPhone className="mr-2 h-3 w-3" />
          {phone}
        </div>
      </div>
      
      {/* Menu Items */}
      <div className="py-2">
        {menuItems.map((item, index) => (
          <div key={index}>
            {item.divider && <div className="my-2 border-t border-gray-100 dark:border-gray-700"></div>}
            <Link 
              href={item.href} 
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
              style={{
                animation: `menuItemEnter 0.3s ease-out ${index * 0.05}s both`
              }}
              onClick={(e) => {
                if (item.onClick) {
                  item.onClick(e);
                } else {
                  onClose();
                }
              }}
            >
              <span className="w-6">{item.icon}</span>
              <span>{item.label}</span>
              {item.rightElement && item.rightElement}
            </Link>
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50/60 dark:bg-gray-700/60 rounded-b-lg border-t border-gray-100 dark:border-gray-700">
        Member since {memberSince}
      </div>
    </div>
  );
});

ProfileDropdown.displayName = 'ProfileDropdown';

export default ProfileDropdown; 