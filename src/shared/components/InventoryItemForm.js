import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import Image from 'next/image';
import { INVENTORY_CATEGORIES, SUPPLIERS } from '../../pages/inventory';

const InventoryItemForm = ({ item, onSubmit, onCancel }) => {
  const initialState = {
    name: '',
    category: '',
    categoryId: '',
    supplierId: '',
    requestedDeliveryDate: '',
    actualDeliveryDate: '',
    requestedQuantity: '',
    unit: 'kg',
    actualQuantity: '',
    price: '',
    status: 'In Stock',
    stockLevel: 70,
    expiryDate: '',
    location: '',
    nutritionalInfo: {
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    },
    tags: []
  };

  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [tag, setTag] = useState('');
  const [imagePreview, setImagePreview] = useState('/images/inventory-placeholder.jpg');

  const units = ['kg', 'g', 'L', 'ml', 'pcs'];
  const statuses = ['In Stock', 'Low Stock', 'Out of Stock', 'On Order'];

  useEffect(() => {
    if (item) {
      setFormData({
        ...item,
        price: item.price.toString(),
        requestedQuantity: item.requestedQuantity.toString(),
        actualQuantity: item.actualQuantity.toString(),
        stockLevel: item.stockLevel || 70,
        nutritionalInfo: {
          calories: item.nutritionalInfo?.calories?.toString() || '',
          protein: item.nutritionalInfo?.protein || '',
          carbs: item.nutritionalInfo?.carbs || '',
          fat: item.nutritionalInfo?.fat || ''
        },
      });
      if (item.imageUrl) {
        setImagePreview(item.imageUrl);
      }
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

  const formatDate = (date) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const getCurrentDate = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();
    return `${year}-${month}-${day}`;
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

  const handleSupplierChange = (supplierId) => {
    const supplier = SUPPLIERS.find(s => s.id === supplierId) || {};
    setFormData(prev => ({
      ...prev, 
      supplierId,
      supplierName: supplier.name || ''
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.supplierId) {
      newErrors.supplierId = 'Supplier is required';
    }
    
    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      newErrors.price = 'Price must be a valid number';
    }
    
    if (!formData.requestedQuantity) {
      newErrors.requestedQuantity = 'Requested quantity is required';
    } else if (isNaN(parseInt(formData.requestedQuantity)) || parseInt(formData.requestedQuantity) <= 0) {
      newErrors.requestedQuantity = 'Quantity must be a positive number';
    }
    
    if (!formData.requestedDeliveryDate) {
      newErrors.requestedDeliveryDate = 'Requested delivery date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotal = () => {
    const price = parseFloat(formData.price) || 0;
    const quantity = parseFloat(formData.actualQuantity || formData.requestedQuantity) || 0;
    return (price * quantity).toFixed(2);
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
      requestedQuantity: parseInt(formData.requestedQuantity),
      actualQuantity: parseInt(formData.actualQuantity) || parseInt(formData.requestedQuantity),
      stockLevel: parseInt(formData.stockLevel) || 70,
      total: parseFloat(calculateTotal()),
      requestedDeliveryDate: formData.requestedDeliveryDate 
        ? formatDate(formData.requestedDeliveryDate)
        : formatDate(new Date()),
      actualDeliveryDate: formData.actualDeliveryDate 
        ? formatDate(formData.actualDeliveryDate)
        : '',
      lastUpdated: new Date().toISOString(),
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
          <h3 className="text-lg font-medium text-gray-900 mb-4">Item Information</h3>
          
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
            
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={(e) => {
                  const category = e.target.value;
                  const categoryObj = INVENTORY_CATEGORIES.find(c => c.name === category) || {};
                  setFormData({
                    ...formData,
                    category,
                    categoryId: categoryObj.id || ''
                  });
                }}
                className={`w-full p-2 border ${errors.category ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900`}
              >
                <option value="">Select a category</option>
                {INVENTORY_CATEGORIES.map(category => (
                  <option key={category.id} value={category.name}>{category.name}</option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
            </div>
            
            {/* Supplier */}
            <div>
              <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 mb-1">
                Supplier *
              </label>
              <select
                id="supplierId"
                name="supplierId"
                value={formData.supplierId}
                onChange={(e) => handleSupplierChange(e.target.value)}
                className={`w-full p-2 border ${errors.supplierId ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900`}
              >
                <option value="">Select a supplier</option>
                {SUPPLIERS.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
              {errors.supplierId && <p className="mt-1 text-xs text-red-500">{errors.supplierId}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price (₦) *
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
              
              <div>
                <label htmlFor="total" className="block text-sm font-medium text-gray-700 mb-1">
                  Total Value (₦)
                </label>
                <input
                  type="text"
                  id="total"
                  readOnly
                  value={calculateTotal()}
                  className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Quantity and Delivery Info */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quantity & Delivery</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Requested Quantity */}
              <div>
                <label htmlFor="requestedQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Requested Quantity *
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="requestedQuantity"
                    name="requestedQuantity"
                    value={formData.requestedQuantity}
                    onChange={handleChange}
                    className={`w-full p-2 border ${errors.requestedQuantity ? 'border-red-300' : 'border-gray-300'} rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900`}
                  />
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="p-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-900"
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                {errors.requestedQuantity && <p className="mt-1 text-xs text-red-500">{errors.requestedQuantity}</p>}
              </div>
              
              {/* Actual Quantity */}
              <div>
                <label htmlFor="actualQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Quantity
                </label>
                <input
                  type="text"
                  id="actualQuantity"
                  name="actualQuantity"
                  value={formData.actualQuantity}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
                  placeholder="Same as requested if empty"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Requested Delivery Date */}
              <div>
                <label htmlFor="requestedDeliveryDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Requested Delivery Date *
                </label>
                <input
                  type="date"
                  id="requestedDeliveryDate"
                  name="requestedDeliveryDate"
                  value={formData.requestedDeliveryDate || getCurrentDate()}
                  onChange={handleChange}
                  className={`w-full p-2 border ${errors.requestedDeliveryDate ? 'border-red-300' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900`}
                />
                {errors.requestedDeliveryDate && <p className="mt-1 text-xs text-red-500">{errors.requestedDeliveryDate}</p>}
              </div>
              
              {/* Actual Delivery Date */}
              <div>
                <label htmlFor="actualDeliveryDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Delivery Date
                </label>
                <input
                  type="date"
                  id="actualDeliveryDate"
                  name="actualDeliveryDate"
                  value={formData.actualDeliveryDate || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              
              {/* Expiry Date */}
              <div>
                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  id="expiryDate"
                  name="expiryDate"
                  value={formData.expiryDate || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
            </div>
            
            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Storage Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
                placeholder="e.g., Shelf A1, Freezer B2"
              />
            </div>
            
            {/* Stock Level */}
            <div>
              <label htmlFor="stockLevel" className="block text-sm font-medium text-gray-700 mb-1">
                Stock Level: {formData.stockLevel}%
              </label>
              <input
                type="range"
                id="stockLevel"
                name="stockLevel"
                min="0"
                max="100"
                value={formData.stockLevel}
                onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Additional Information */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Nutritional Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Nutritional Information (per 100g)</h4>
            <div className="grid grid-cols-2 gap-4">
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
          
          {/* Tags */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
                placeholder="Add a tag (e.g., fresh, frozen)"
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
              {formData.tags.length > 0 ? (
                formData.tags.map((t, index) => (
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
                ))
              ) : (
                <span className="text-sm text-gray-500">No tags added</span>
              )}
            </div>
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
          {item ? 'Update Item' : 'Add Item'}
        </button>
      </div>
    </form>
  );
};

export default InventoryItemForm; 