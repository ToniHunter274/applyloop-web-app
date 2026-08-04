import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import Image from 'next/image';
import { FOOD_CATEGORIES } from '../../data/foods';

const MenuItemForm = ({ item, onSubmit, onCancel }) => {
  const initialState = {
    name: '',
    description: '',
    price: '',
    categoryId: '',
    isAvailable: true,
    isPopular: false,
    preparationTime: '',
    imageUrl: '/images/food-placeholder.jpg',
    nutritionalInfo: {
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    },
    allergens: [],
    tags: []
  };

  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [tag, setTag] = useState('');
  const [allergen, setAllergen] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (item) {
      setFormData({
        ...item,
        price: item.price.toString(),
        preparationTime: item.preparationTime?.toString() || '',
        nutritionalInfo: {
          calories: item.nutritionalInfo?.calories?.toString() || '',
          protein: item.nutritionalInfo?.protein || '',
          carbs: item.nutritionalInfo?.carbs || '',
          fat: item.nutritionalInfo?.fat || ''
        },
      });
      setImagePreview(item.imageUrl);
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
    
    // Clear error when typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addTag = () => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
      setTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addAllergen = () => {
    if (allergen.trim() && !formData.allergens.includes(allergen.trim())) {
      setFormData(prev => ({
        ...prev,
        allergens: [...prev.allergens, allergen.trim()]
      }));
      setAllergen('');
    }
  };

  const removeAllergen = (allergenToRemove) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.filter(a => a !== allergenToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be a positive number';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    
    if (formData.preparationTime && (isNaN(parseInt(formData.preparationTime)) || parseInt(formData.preparationTime) <= 0)) {
      newErrors.preparationTime = 'Preparation time must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Format data for submission
    const formattedData = {
      ...formData,
      price: parseFloat(formData.price),
      preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : null,
      nutritionalInfo: {
        calories: formData.nutritionalInfo.calories ? parseInt(formData.nutritionalInfo.calories) : null,
        protein: formData.nutritionalInfo.protein,
        carbs: formData.nutritionalInfo.carbs,
        fat: formData.nutritionalInfo.fat
      }
    };
    
    onSubmit(formattedData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Basic Information Column */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
          
          <div className="space-y-4">
            {/* Item Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full p-2 border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
            
            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={`w-full p-2 border ${errors.description ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900`}
              />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price (₦) *
                </label>
                <input
                  type="text"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className={`w-full p-2 border ${errors.price ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900`}
                />
                {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
              </div>
              
              {/* Prep Time */}
              <div>
                <label htmlFor="preparationTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Prep Time (min)
                </label>
                <input
                  type="text"
                  id="preparationTime"
                  name="preparationTime"
                  value={formData.preparationTime}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
            </div>
            
            {/* Category */}
            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category || ''}
                onChange={handleChange}
                className={`w-full p-2 border ${errors.categoryId ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900`}
              />
              {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId}</p>}
            </div>
            
            {/* Checkboxes */}
            <div className="flex space-x-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAvailable"
                  name="isAvailable"
                  checked={formData.isAvailable}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900">
                  Available
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPopular"
                  name="isPopular"
                  checked={formData.isPopular}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPopular" className="ml-2 block text-sm text-gray-900">
                  Popular Item
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Image & Additional Info Column */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Image & Additional Info</h3>
          
          <div className="space-y-4">
            {/* Item Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Image
              </label>
              
              <div className="flex items-center space-x-4">
                <div className="relative h-24 w-24 rounded-md overflow-hidden bg-gray-100 border border-gray-300">
                  {imagePreview && (
                    <Image
                      src={imagePreview}
                      alt="Food preview"
                      layout="fill"
                      objectFit="cover"
                    />
                  )}
                </div>
                
                <button
                  type="button" 
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => document.getElementById('image-upload').click()}
                >
                  Change Image
                </button>
                <input 
                  id="image-upload" 
                  type="file" 
                  className="hidden" 
                  onChange={handleImageChange} 
                  accept="image/*" 
                />
              </div>
            </div>
            
            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
                  placeholder="Add a tag (e.g., spicy)"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((t, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                    >
                      <FiX className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            
            {/* Allergens */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allergens
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={allergen}
                  onChange={(e) => setAllergen(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
                  placeholder="Add an allergen"
                />
                <button
                  type="button"
                  onClick={addAllergen}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.allergens.length === 0 ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    None
                    <button
                      type="button"
                      className="ml-1 text-red-500 hover:text-red-700"
                    >
                      <FiX className="h-3 w-3" />
                    </button>
                  </span>
                ) : (
                  formData.allergens.map((a, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {a}
                      <button
                        type="button"
                        onClick={() => removeAllergen(a)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        <FiX className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Nutritional Information */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Nutritional Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="nutritionalInfo.calories" className="block text-sm font-medium text-gray-700 mb-1">
              Calories
            </label>
            <input
              type="text"
              id="nutritionalInfo.calories"
              name="nutritionalInfo.calories"
              value={formData.nutritionalInfo.calories}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
              placeholder="e.g., 450"
            />
          </div>
          
          <div>
            <label htmlFor="nutritionalInfo.protein" className="block text-sm font-medium text-gray-700 mb-1">
              Protein
            </label>
            <input
              type="text"
              id="nutritionalInfo.protein"
              name="nutritionalInfo.protein"
              value={formData.nutritionalInfo.protein}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
              placeholder="e.g., 20g"
            />
          </div>
          
          <div>
            <label htmlFor="nutritionalInfo.carbs" className="block text-sm font-medium text-gray-700 mb-1">
              Carbs
            </label>
            <input
              type="text"
              id="nutritionalInfo.carbs"
              name="nutritionalInfo.carbs"
              value={formData.nutritionalInfo.carbs}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
              placeholder="e.g., 30g"
            />
          </div>
          
          <div>
            <label htmlFor="nutritionalInfo.fat" className="block text-sm font-medium text-gray-700 mb-1">
              Fat
            </label>
            <input
              type="text"
              id="nutritionalInfo.fat"
              name="nutritionalInfo.fat"
              value={formData.nutritionalInfo.fat}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
              placeholder="e.g., 15g"
            />
          </div>
        </div>
      </div>
      
      {/* Form Buttons */}
      <div className="flex justify-end space-x-3 pt-6 mt-8 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {item ? 'Update Item' : 'Create Item'}
        </button>
      </div>
    </form>
  );
};

export default MenuItemForm; 