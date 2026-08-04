import React from 'react';

/**
 * FoodCard component for displaying food items
 * This component is designed to work in both the web and mobile app
 * 
 * @param {Object} props
 * @param {string} props.name - Name of the food item
 * @param {string} props.description - Description of the food item
 * @param {string} props.imageUrl - URL of the food image
 * @param {number} props.price - Price of the food item
 * @param {string} props.restaurantName - Name of the restaurant
 * @param {Function} props.onPress - Function to call when card is pressed/clicked
 */
const FoodCard = ({ 
  name, 
  description, 
  imageUrl, 
  price, 
  restaurantName, 
  onPress 
}) => {
  // For web rendering
  const WebCard = () => (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onPress}
    >
      <div className="relative h-48">
        <img 
          src={imageUrl || "https://via.placeholder.com/300x200/f87171/ffffff?text=Food+Image"} 
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = "https://via.placeholder.com/300x200/f87171/ffffff?text=Food+Image";
          }}
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-1">{name}</h3>
        <p className="text-gray-600 text-sm mb-2">{restaurantName}</p>
        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{description}</p>
        <div className="flex justify-between items-center">
          <span className="font-bold text-red-600">${price.toFixed(2)}</span>
          <button className="bg-red-600 text-white px-3 py-1 rounded-full text-sm">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
  
  return WebCard();
};

export default FoodCard; 