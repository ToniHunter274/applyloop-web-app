import { memo, useState, useRef, useEffect } from 'react';
import { FiSearch, FiX, FiBell, FiGift, FiShoppingBag, FiDollarSign } from 'react-icons/fi';

const GiftNotificationDropdown = memo(({ isOpen, onClose }) => {
  const dropdownRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Mock notification data for the gift timeline
  const notifications = [
    {
      id: 1,
      type: 'gift_sent',
      title: 'You sent a gift card to John Doe',
      content: 'Pizza voucher worth ₦5,000',
      time: '20 minutes ago',
      color: 'bg-green-500',
    },
    {
      id: 2,
      type: 'gift_received',
      title: 'You received a gift from Sarah',
      content: 'Discount coupon for 15% off your next order',
      time: '2 hours ago',
      color: 'bg-purple-500',
    },
    {
      id: 3,
      type: 'gift_redeemed',
      title: 'Gift card redeemed',
      content: 'Michael redeemed your birthday gift card',
      time: 'Yesterday',
      color: 'bg-blue-500',
    },
    {
      id: 4,
      type: 'gift_expired',
      title: 'Gift card expired',
      content: 'Dessert voucher for James has expired',
      time: '3 days ago',
      color: 'bg-orange-500',
    },
    {
      id: 5,
      type: 'gift_promotion',
      title: 'New gift promotion available',
      content: 'Send gifts to 3 friends and get one free',
      time: '5 days ago',
      color: 'bg-pink-500',
    }
  ];

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

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className={`absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100/40 backdrop-blur-sm z-50 
        ${isAnimating ? 'animate-dropdownEnter' : ''}`}
      style={{
        transformOrigin: 'top right'
      }}
    >
      {/* Arrow pointing to the button */}
      <div className="absolute -top-2 right-4 w-4 h-4 bg-white transform rotate-45 border-t border-l border-gray-100/40 shadow-[-3px_-3px_5px_rgb(0,0,0,0.02)]"></div>
      
      {/* Header */}
      <div className="p-4 border-b border-gray-100/60 bg-purple-900 rounded-t-lg text-white">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Gift Activities</h3>
          <div className="flex items-center space-x-2">
            <button 
              className="text-white/80 hover:text-white transition-all duration-200 hover:scale-110"
              title="View all gift activities"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-sm text-white/70 mt-1">Recent gift activities and promotions</p>
      </div>

      {/* Gift Timeline */}
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-4">
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-gray-200"></div>
          
          {/* Timeline entries */}
          {notifications.map((notification, index) => (
            <div
              key={notification.id}
              className="relative pl-10 pb-6 animate-timelineEnter"
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              {/* Timeline dot */}
              <div className={`absolute left-2 top-1.5 w-5 h-5 rounded-full ${notification.color} shadow-md z-10 flex items-center justify-center animate-pulse`}>
                <span className="block w-2 h-2 bg-white rounded-full"></span>
              </div>
              
              {/* Content card */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 cursor-pointer">
                <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                <p className="text-xs text-gray-600 mt-1">{notification.content}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-gray-400">{notification.time}</span>
                  <button className="text-purple-500 hover:text-purple-700 text-xs font-medium">Details</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-gray-100/60 flex justify-between items-center">
        <button className="text-sm text-purple-600 hover:text-purple-800 font-medium">
          View All Activities
        </button>
        <button className="text-sm px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200">
          Send a Gift
        </button>
      </div>
    </div>
  );
});

GiftNotificationDropdown.displayName = 'GiftNotificationDropdown';

export default GiftNotificationDropdown; 