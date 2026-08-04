import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { FiSearch, FiHeart, FiPlus } from 'react-icons/fi';
import DashboardLayout from '../shared/components/DashboardLayout';
import SEO from '../shared/components/SEO';
import useCart from '../shared/hooks/useCart';
import useApi from '../shared/hooks/useApi';
import { MOCK_FOODS, FOOD_CATEGORIES } from '../data/foods';

// Card component that matches the design from the image
const FoodCard = ({ food, onAddToCart, onToggleFavorite, isFavorite, likeCount = 0 }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
      <div className="flex">
        <div className="relative h-32 w-32 flex-shrink-0">
          <Image 
            src={food.imageUrl} 
            alt={food.name} 
            layout="fill" 
            objectFit="cover"
          />
        </div>
        <div className="p-3 flex-1">
          <div className="mb-1">
            <h3 className="text-lg font-medium text-gray-800">{food.name}</h3>
            <p className="text-sm text-gray-600 mt-0.5">₦{food.price.toLocaleString()}</p>
          </div>
          <p className="text-sm text-gray-500 line-clamp-2">{food.description}</p>
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => onToggleFavorite(food.id)}
                className="text-sm flex items-center space-x-1"
              >
                <FiHeart className={`h-4 w-4 ${isFavorite ? 'fill-current text-red-500' : 'text-gray-400'}`} />
                <span className="text-gray-500">{likeCount}</span>
              </button>
            </div>
            <button 
              onClick={() => onAddToCart(food)}
              className="flex items-center bg-blue-600 text-white py-1.5 px-3 rounded text-sm hover:bg-blue-700"
            >
              Add Item
              <FiPlus className="ml-1 h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Menu = () => {
  const [foods, setFoods] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Popular Items');
  const [deliveryOption, setDeliveryOption] = useState('pickup');
  const [favorites, setFavorites] = useState({});
  const { addItem } = useCart();
  const { loading, error } = useApi();
  const router = useRouter();
  
  // Mock like counts
  const likeCounts = {
    'food-001': 61,
    'food-002': 59,
    'food-003': 83,
    'food-004': 1,
    'food-005': 43,
    'food-006': 191,
    'food-007': 27,
    'food-008': 15,
    'food-009': 38,
    'food-010': 72,
    'food-011': 9,
    'food-012': 14
  };
  
  // Fetch food data
  useEffect(() => {
    // Mock loading data
    setTimeout(() => {
      setFoods(MOCK_FOODS);
    }, 800);
  }, []);
  
  // Filter foods based on search term and category
  const filteredFoods = foods.filter(food => {
    const matchesSearch = !searchTerm || 
      food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      food.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedCategory === 'Popular Items') {
      return (!searchTerm || matchesSearch) && food.isPopular;
    }
    
    const matchesCategory = selectedCategory === 'All' || 
      food.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  const handleAddToCart = (food) => {
    addItem({
      id: food.id,
      name: food.name,
      price: food.price,
      quantity: 1,
      imageUrl: food.imageUrl
    });
  };
  
  const toggleFavorite = (id) => {
    setFavorites(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Simplified categories for sidebar
  const sidebarCategories = [
    'Popular Items',
    'Tacos', 
    'Entrees', 
    'Sides', 
    'Homemade Salsas',
    'Kids Menu',
    'Dessert',
    'Homemade Drinks',
    'Beverages'
  ];
  
  return (
    <DashboardLayout>
      <SEO 
        title="Talkin Tacos - Menu" 
        description="Browse our delicious menu items" 
      />
      
      <div className="flex flex-col md:flex-row gap-6 max-w-5xl mx-auto">
        {/* Sidebar Categories */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="sticky top-24">
            {/* Restaurant Title */}
            <div className="mb-4">
              <h1 className="text-lg font-bold text-gray-900 mb-1">Talkin Tacos - Miramar Top Picks</h1>
            </div>
            
            {/* Delivery Options */}
            <div className="flex mb-4 border border-gray-200 rounded-md overflow-hidden">
              <button
                className={`flex-1 py-2 px-3 text-center text-sm font-medium ${
                  deliveryOption === 'pickup' ? 'bg-green-500 text-white' : 'bg-white'
                }`}
                onClick={() => setDeliveryOption('pickup')}
              >
                PICKUP
                <span className="block text-xs mt-0.5 opacity-80">20 min</span>
              </button>
              <button
                className={`flex-1 py-2 px-3 text-center text-sm font-medium ${
                  deliveryOption === 'delivery' ? 'bg-green-500 text-white' : 'bg-white'
                }`}
                onClick={() => setDeliveryOption('delivery')}
              >
                DELIVERY
                <span className="block text-xs mt-0.5 opacity-80">25 min</span>
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input 
                type="text" 
                className="bg-white border border-gray-200 text-gray-900 text-sm rounded-lg block w-full pl-10 p-2.5" 
                placeholder="Search" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Menu Categories */}
            <ul className="space-y-1">
              {sidebarCategories.map(category => (
                <li key={category}>
                  <button
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-2 py-2 rounded-md transition-colors ${
                      selectedCategory === category 
                        ? 'bg-blue-50 text-blue-600 font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {category}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Menu Items */}
        <div className="flex-1">
        {loading ? (
          <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        ) : (
            <>
              {filteredFoods.length === 0 ? (
                <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                  <p className="text-gray-600">No items found matching your criteria.</p>
                </div>
              ) : (
                <div>
                  {filteredFoods.map(food => (
              <FoodCard
                key={food.id}
                      food={food}
                      onAddToCart={handleAddToCart}
                      onToggleFavorite={toggleFavorite}
                      isFavorite={favorites[food.id]}
                      likeCount={likeCounts[food.id] || Math.floor(Math.random() * 100)}
              />
            ))}
          </div>
        )}
            </>
          )}
        </div>
    </div>
    </DashboardLayout>
  );
};

export default Menu; 