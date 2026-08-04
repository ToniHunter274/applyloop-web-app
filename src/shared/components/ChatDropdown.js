import { memo, useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiX, FiMoreHorizontal, FiPlus, FiSearch, FiTrash2, FiEdit } from 'react-icons/fi';

const ChatDropdown = memo(({ isOpen, onClose, chatList }) => {
  const dropdownRef = useRef(null);
  const [activeTab, setActiveTab] = useState('CHAT');
  const [isAnimating, setIsAnimating] = useState(false);

  // Mock data for Notes
  const notes = [
    { id: 1, title: 'New order placed..', date: '10 Aug 2023' },
    { id: 2, title: 'Youtube, a video-sh...', date: '10 Aug 2023' },
    { id: 3, title: 'John just buy your pr...', date: '10 Aug 2023' },
    { id: 4, title: 'Athan Jacoby', date: '10 Aug 2023' },
  ];

  // Mock data for Alerts
  const alerts = [
    { 
      id: 1, 
      category: 'SERVER STATUS', 
      title: 'David Nester Birthday', 
      subtitle: 'Today', 
      initials: 'KK', 
      color: 'bg-pink-100 text-pink-800' 
    },
    { 
      id: 2, 
      category: 'SOCIAL', 
      title: 'Perfection Simplified', 
      subtitle: 'Jane Smith commented...', 
      initials: 'RU', 
      color: 'bg-green-100 text-green-800' 
    },
    { 
      id: 3, 
      category: 'SERVER STATUS', 
      title: 'AharlieKane', 
      subtitle: 'Sami is online', 
      initials: 'AU', 
      color: 'bg-yellow-100 text-yellow-800' 
    },
    { 
      id: 4, 
      category: 'SERVER STATUS', 
      title: 'Athan Jacoby', 
      subtitle: 'Nargis left 30 mins ago', 
      initials: 'MO', 
      color: 'bg-blue-100 text-blue-800' 
    },
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

  const tabs = ['NOTES', 'ALERTS', 'CHAT'];

  // Function to render the correct content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'NOTES':
        return (
          <>
            {/* Notes Header */}
            <div className="p-4 border-b border-gray-100/60">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
                <div className="flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110">
                    <FiPlus className="h-5 w-5" />
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110">
                    <FiSearch className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">Add New Note</p>
            </div>

            {/* Notes List */}
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
              {notes.map((note, index) => (
                <div 
                  key={note.id}
                  className="p-4 border-b border-gray-100/60 hover:bg-gray-50/50 transition-all duration-200 cursor-pointer"
                  style={{
                    animation: `noteEnter 0.3s ease-out ${index * 0.08}s both`
                  }}
                >
                  <div className="flex justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">{note.title}</h4>
                      <p className="text-xs text-gray-500">{note.date}</p>
                    </div>
                    <div className="flex space-x-1">
                      <button className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100">
                        <FiTrash2 className="h-3 w-3 text-red-500" />
                      </button>
                      <button className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100">
                        <FiEdit className="h-3 w-3 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      
      case 'ALERTS':
        return (
          <>
            {/* Alerts Header */}
            <div className="p-4 border-b border-gray-100/60">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <div className="flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110">
                    <FiMoreHorizontal className="h-5 w-5" />
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110">
                    <FiSearch className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">Show All</p>
            </div>

            {/* Alerts List */}
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
              {/* Group alerts by category */}
              {Object.entries(groupByCategory(alerts)).map(([category, items], catIndex) => (
                <div 
                  key={category}
                  style={{
                    animation: `sectionEnter 0.3s ease-out ${catIndex * 0.1}s both`
                  }}
                >
                  <div className="px-4 py-2 bg-gray-50/50 backdrop-blur-sm sticky top-0 z-10 text-xs font-semibold text-gray-700">
                    {category}
                  </div>
                  {items.map((alert, itemIndex) => (
                    <div 
                      key={alert.id}
                      className="p-4 border-b border-gray-100/60 hover:bg-gray-50/50 transition-all duration-200 cursor-pointer"
                      style={{
                        animation: `alertEnter 0.3s ease-out ${catIndex * 0.1 + itemIndex * 0.05}s both`
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center ${alert.color}`}>
                          <span className="text-sm font-semibold">{alert.initials}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                          <p className={`text-xs ${alert.category === 'SOCIAL' ? 'text-gray-500' : 'text-pink-500'}`}>
                            {alert.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        );

      case 'CHAT':
        return (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-100/60">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Chat List</h3>
                <div className="flex items-center space-x-2">
                  <button className="text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110">
                    <FiPlus className="h-5 w-5" />
                  </button>
                  <button className="text-gray-400 hover:text-gray-600 transition-all duration-200 hover:scale-110">
                    <FiMoreHorizontal className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">Show All</p>
            </div>

            {/* Chat List */}
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
              {/* Alphabetical Sections */}
              {Object.entries(groupByFirstLetter(chatList || [])).map(([letter, users], sectionIndex) => (
                <div 
                  key={letter} 
                  className="border-b border-gray-100/60"
                  style={{
                    animation: `sectionEnter 0.3s ease-out ${sectionIndex * 0.1}s both`
                  }}
                >
                  <div className="px-4 py-2 bg-gray-50/50 backdrop-blur-sm sticky top-0 z-10">
                    <span className="text-sm font-medium text-gray-500">{letter}</span>
                  </div>
                  {users.map((user, userIndex) => (
                    <div 
                      key={user.id}
                      className="p-3 hover:bg-blue-50/50 transition-all duration-200 cursor-pointer group"
                      style={{
                        animation: `userEnter 0.3s ease-out ${(sectionIndex * 0.1 + userIndex * 0.05)}s both`
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative transform transition-transform duration-200 group-hover:scale-105">
                          <img 
                            src={user.avatar} 
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-blue-100 transition-all duration-200"
                            onError={(e) => {
                              if (typeof window !== 'undefined') {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                              }
                            }}
                          />
                          {user.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                            {user.name}
                          </h4>
                          <p className="text-xs text-gray-500 group-hover:text-blue-500/70 transition-colors duration-200">
                            {user.isOnline ? 'Online' : `${user.lastSeen}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

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
      
      {/* Tabs */}
      <div className="flex border-b border-gray-100/60 bg-purple-900 rounded-t-lg text-white">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium transition-all duration-200 relative
              ${activeTab === tab 
                ? 'bg-purple-800' 
                : 'hover:bg-purple-800/70'
              }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white animate-tabEnter" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content - Dynamically rendered based on active tab */}
      {renderTabContent()}
    </div>
  );
});

// Helper function to group users by first letter of their name
function groupByFirstLetter(users) {
  if (!Array.isArray(users) || users.length === 0) return {};
  
  return users.reduce((acc, user) => {
    const firstLetter = user.name.charAt(0).toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(user);
    return acc;
  }, {});
}

// Helper function to group alerts by category
function groupByCategory(alerts) {
  return alerts.reduce((acc, alert) => {
    if (!acc[alert.category]) {
      acc[alert.category] = [];
    }
    acc[alert.category].push(alert);
    return acc;
  }, {});
}

ChatDropdown.displayName = 'ChatDropdown';

export default ChatDropdown; 