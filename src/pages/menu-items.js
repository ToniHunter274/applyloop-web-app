import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiFilter, FiEye } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import SEO from '../shared/components/SEO';
import DashboardLayout from '../shared/components/DashboardLayout';
import MenuItemForm from '../shared/components/MenuItemForm';
import { MOCK_FOODS, FOOD_CATEGORIES } from '../data/foods';

export default function MenuItems() {
  const [foods, setFoods] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  
  useEffect(() => {
    // Simulate API fetch with delay
    const fetchFoods = async () => {
      try {
        setTimeout(() => {
          setFoods(MOCK_FOODS);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching foods:', error);
        setLoading(false);
      }
    };
    
    fetchFoods();
  }, []);
  
  // Filter foods based on search term and category
  const filteredFoods = foods.filter(food => {
    const matchesSearch = !searchTerm || 
      food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      food.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      food.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || 
      food.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Get unique categories
  const categories = ['All', ...new Set(foods.map(food => food.category))];
  
  const handleEdit = (item) => {
    setCurrentItem(item);
    setShowModal(true);
  };
  
  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setFoods(prev => prev.filter(food => food.id !== id));
    }
  };
  
  const handleAdd = () => {
    setCurrentItem(null);
    setShowModal(true);
  };
  
  const handleFormSubmit = (formData) => {
    if (currentItem) {
      // Update existing item
      setFoods(prev => 
        prev.map(item => 
          item.id === currentItem.id ? { ...formData, id: currentItem.id } : item
        )
      );
    } else {
      // Add new item with a generated ID
      const newId = `food-${String(foods.length + 1).padStart(3, '0')}`;
      setFoods(prev => [...prev, { ...formData, id: newId }]);
    }
    
    setShowModal(false);
  };
  
  return (
    <DashboardLayout>
      <SEO 
        title="Menu Items" 
        description="Manage your restaurant&apos;s menu items and categories" 
      />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Items</h1>
          <p className="text-gray-500 mt-1">Manage your restaurant&apos;s menu items</p>
        </div>
        
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus />
          <span>Add New Item</span>
        </button>
      </div>
      
      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          {/* Search */}
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input 
              type="text" 
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5" 
              placeholder="Search menu items..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Category filter */}
          <div className="flex items-center space-x-2">
            <div className="text-gray-500">
              <FiFilter className="h-5 w-5" />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Menu Items Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredFoods.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No menu items found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFoods.map((food) => (
                  <tr key={food.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 mr-3">
                          <Image
                            className="h-10 w-10 rounded-full object-cover"
                            src={food.imageUrl || '/images/food-placeholder.jpg'}
                            alt={food.name}
                            width={40}
                            height={40}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{food.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{food.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {food.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₦{food.price.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        food.isAvailable 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {food.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link href={`/food/${food.id}`} className="text-gray-400 hover:text-gray-500">
                          <FiEye className="h-5 w-5" />
                        </Link>
                        <button 
                          onClick={() => handleEdit(food)} 
                          className="text-blue-400 hover:text-blue-500"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(food.id)} 
                          className="text-red-400 hover:text-red-500"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Pagination - Simple version */}
      <div className="flex justify-between items-center mt-6 text-sm">
        <div className="text-gray-500">
          Showing <span className="font-medium">{filteredFoods.length}</span> of <span className="font-medium">{foods.length}</span> menu items
        </div>
        <div className="flex space-x-1">
          <button className="px-3 py-1 bg-white border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50">
            Previous
          </button>
          <button className="px-3 py-1 bg-blue-600 border border-blue-600 rounded-md text-white hover:bg-blue-700">
            1
          </button>
          <button className="px-3 py-1 bg-white border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50">
            2
          </button>
          <button className="px-3 py-1 bg-white border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50">
            3
          </button>
          <button className="px-3 py-1 bg-white border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>
      
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-xl font-medium text-gray-900">
                {currentItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>
            </div>
            <div className="p-6">
              <MenuItemForm 
                item={currentItem}
                onSubmit={handleFormSubmit}
                onCancel={() => setShowModal(false)}
              />
            </div>
          </div>
        </div>
      )}
      
    </DashboardLayout>
  );
} 