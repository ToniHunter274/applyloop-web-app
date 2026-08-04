import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { FiArrowLeft, FiStar, FiClock, FiShoppingCart, FiHeart, FiShare2, FiInfo } from 'react-icons/fi';
import DashboardLayout from '../../shared/components/DashboardLayout';
import SEO from '../../shared/components/SEO';
import useApi from '../../shared/hooks/useApi';
import useCart from '../../shared/hooks/useCart';
import { MOCK_FOODS } from '../../data/foods';

const FoodDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const [food, setFood] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const { loading, error, get } = useApi();
  const { addItem } = useCart();

  useEffect(() => {
    if (!id) return;

    const fetchFoodDetails = async () => {
      try {
        // In a real app with backend
        // const data = await get(`/foods/${id}`);
        // setFood(data);
        
        // For now, use mock data
        const foundFood = MOCK_FOODS.find(item => item.id === id);
        if (foundFood) {
          setFood(foundFood);
        } else {
          throw new Error('Food not found');
        }
      } catch (err) {
        console.error('Error fetching food details:', err);
      }
    };

    fetchFoodDetails();
  }, [id, get]);

  const handleAddToCart = () => {
    if (!food) return;
    
    addItem({
      id: food.id,
      name: food.name,
      price: food.price,
      quantity: quantity,
      imageUrl: food.imageUrl,
      restaurantId: food.restaurantId,
      restaurantName: food.restaurantName
    });

    alert(`${quantity} x ${food.name} added to cart!`);
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) return;
    setQuantity(newQuantity);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !food) {
    return (
      <DashboardLayout>
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error || 'Food not found'}
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 flex items-center text-blue-600 hover:text-blue-800"
        >
          <FiArrowLeft className="mr-2" />
          Back to Menu
        </button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <SEO 
        title={`${food.name} | Foodie`}
        description={food.description}
      />

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
      >
        <FiArrowLeft className="mr-2" />
        Back to Menu
      </button>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Food Image */}
          <div className="relative h-96 w-full">
            <Image 
              src={food.imageUrl || '/images/food-placeholder.jpg'} 
              alt={food.name} 
              layout="fill" 
              objectFit="cover"
              className="transition-transform duration-300 hover:scale-105"
            />
            {food.isPopular && (
              <div className="absolute top-4 left-4 bg-red-500 text-white text-sm px-3 py-1 rounded-full">
                Popular
              </div>
            )}
          </div>

          {/* Food Details */}
          <div className="p-6">
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{food.name}</h1>
              <div className="flex space-x-2">
                <button className="p-2 text-gray-400 hover:text-red-500 bg-gray-100 rounded-full">
                  <FiHeart className="h-5 w-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-blue-500 bg-gray-100 rounded-full">
                  <FiShare2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <p className="text-lg text-gray-700 mb-4">{food.description}</p>

            <div className="flex items-center mb-4">
              <div className="flex items-center text-yellow-400 mr-4">
                <FiStar className="fill-current" />
                <span className="ml-1 text-gray-800">{food.rating}</span>
                <span className="ml-1 text-gray-500">({food.reviews} reviews)</span>
              </div>
              
              <div className="flex items-center text-gray-500">
                <FiClock className="mr-1" />
                <span>{food.preparationTime} min</span>
              </div>
            </div>

            <div className="text-2xl font-bold text-blue-600 mb-6">
              ₦{food.price.toLocaleString()}
            </div>

            <div className="flex items-center mb-8">
              <div className="mr-6">
                <label className="block text-gray-700 mb-2">Quantity</label>
                <div className="flex items-center border rounded-md w-32">
                  <button 
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    min="1" 
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                    className="w-full text-center focus:outline-none"
                  />
                  <button 
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <button 
                onClick={handleAddToCart}
                className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                <FiShoppingCart className="mr-2" />
                Add to Cart
              </button>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="text-sm text-gray-600 mb-2">From <span className="font-medium">{food.restaurantName}</span></div>
              <div className="text-sm text-gray-600">Category: <span className="font-medium">{food.category}</span></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-gray-200">
          <div className="flex border-b">
            <button 
              onClick={() => setActiveTab('description')}
              className={`px-6 py-3 text-sm font-medium ${activeTab === 'description' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Description
            </button>
            <button 
              onClick={() => setActiveTab('nutritional')}
              className={`px-6 py-3 text-sm font-medium ${activeTab === 'nutritional' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Nutritional Info
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`px-6 py-3 text-sm font-medium ${activeTab === 'reviews' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Reviews
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'description' && (
              <div>
                <h3 className="text-lg font-medium mb-3">About this Food</h3>
                <p className="text-gray-600">{food.description}</p>
                
                {food.allergens && food.allergens.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-800 mb-2">Allergens</h4>
                    <div className="flex flex-wrap gap-2">
                      {food.allergens.map((allergen, index) => (
                        <span key={index} className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs flex items-center">
                          <FiInfo className="mr-1" />
                          {allergen}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {food.tags && food.tags.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-800 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {food.tags.map((tag, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'nutritional' && (
              <div>
                <h3 className="text-lg font-medium mb-3">Nutritional Information</h3>
                {food.nutritionalInfo ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Calories</div>
                      <div className="text-lg font-medium text-gray-800">{food.nutritionalInfo.calories} kcal</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Protein</div>
                      <div className="text-lg font-medium text-gray-800">{food.nutritionalInfo.protein}</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Carbs</div>
                      <div className="text-lg font-medium text-gray-800">{food.nutritionalInfo.carbs}</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Fat</div>
                      <div className="text-lg font-medium text-gray-800">{food.nutritionalInfo.fat}</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Nutritional information not available for this item.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <h3 className="text-lg font-medium mb-3">Customer Reviews</h3>
                <p className="text-gray-500">Reviews coming soon!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FoodDetail; 