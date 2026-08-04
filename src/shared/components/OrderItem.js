import { memo, useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { FiMoreVertical, FiCheck, FiX, FiInfo } from 'react-icons/fi';

const OrderItem = memo(({ 
  image, 
  title, 
  orderId, 
  price, 
  quantity, 
  status, 
  customerName, 
  location,
  onActionClick
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [imgSrc, setImgSrc] = useState(image);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target) && 
        buttonRef.current && 
        !buttonRef.current.contains(event.target)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef, buttonRef]);

  const getStatusStyles = () => {
    switch(status?.toLowerCase()) {
      case 'pending':
        return 'bg-amber-50 text-amber-500 border-amber-200';
      case 'delivered':
        return 'bg-green-50 text-green-500 border-green-200';
      case 'canceled':
        return 'bg-red-50 text-red-500 border-red-200';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  // Fallback image handling
  const handleImageError = () => {
    setImgSrc('/images/food-placeholder.jpg');
  };

  const handleActionClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleOptionClick = (action) => {
    setShowMenu(false);
    onActionClick(orderId, action);
  };

  return (
    <div className="flex items-center py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors rounded-lg px-2">
      <div className="flex items-center flex-1">
        <div className="w-16 h-16 rounded-full overflow-hidden relative mr-4 border border-gray-200">
          <Image 
            src={imgSrc}
            alt={title}
            width={64}
            height={64}
            className="object-cover w-full h-full"
            onError={handleImageError}
          />
        </div>

        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-blue-600 font-medium">#{orderId}</p>
        </div>
      </div>

      <div className="hidden md:block flex-1">
        <p className="text-sm text-gray-700 font-medium">{customerName}</p>
        <p className="text-xs text-gray-500">{location}</p>
      </div>

      <div className="flex items-center">
        <div className="mr-6 text-right">
          <div className="text-lg font-bold text-gray-900">₦{price}</div>
          <div className="text-sm text-gray-500">x{quantity}</div>
        </div>

        <div className="mr-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyles()}`}>
            {status}
          </span>
        </div>

        <div className="relative">
          <button 
            ref={buttonRef}
            onClick={handleActionClick} 
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="More actions"
          >
            <FiMoreVertical />
          </button>

          {showMenu && (
            <div 
              ref={menuRef}
              className="absolute z-10 right-0 mt-1 bg-white rounded-lg shadow-lg py-2 w-48 border border-gray-100 animate-fadeIn"
            >
              {/* Arrow pointing to the button */}
              <div className="absolute -top-2 right-3 w-4 h-4 bg-white transform rotate-45 border-t border-l border-gray-100"></div>
              
              <button 
                onClick={() => handleOptionClick('accept')}
                className="w-full px-4 py-2 text-left flex items-center hover:bg-gray-50 text-sm"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 mr-2">
                  <FiCheck className="text-green-600" />
                </div>
                <span>Accept order</span>
              </button>
              
              <button 
                onClick={() => handleOptionClick('reject')}
                className="w-full px-4 py-2 text-left flex items-center hover:bg-gray-50 text-sm"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 mr-2">
                  <FiX className="text-red-600" />
                </div>
                <span>Reject order</span>
              </button>
              
              <button 
                onClick={() => handleOptionClick('view')}
                className="w-full px-4 py-2 text-left flex items-center hover:bg-gray-50 text-sm"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 mr-2">
                  <FiInfo className="text-blue-600" />
                </div>
                <span>View Details</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

OrderItem.displayName = 'OrderItem';

export default OrderItem; 