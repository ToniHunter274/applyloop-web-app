// Next.js API route for foods 
// GET: Returns all food items or filtered based on query parameters
// POST: Creates a new food item

import { MOCK_FOODS, FOOD_CATEGORIES, RESTAURANTS } from '../../../data/foods';

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        return getFoods(req, res);
      case 'POST':
        return createFood(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}

function getFoods(req, res) {
  const { 
    categoryId, 
    query, 
    restaurantId, 
    isPopular, 
    minRating,
    maxPrice,
    tags,
    sortBy,
    sortOrder,
    limit,
    page
  } = req.query;

  // Start with all foods 
  let filteredFoods = [...MOCK_FOODS];

  // Apply filters
  if (categoryId) {
    filteredFoods = filteredFoods.filter(food => food.categoryId === categoryId);
  }

  if (restaurantId) {
    filteredFoods = filteredFoods.filter(food => food.restaurantId === restaurantId);
  }

  if (isPopular) {
    filteredFoods = filteredFoods.filter(food => food.isPopular === (isPopular === 'true'));
  }

  if (minRating) {
    filteredFoods = filteredFoods.filter(food => food.rating >= parseFloat(minRating));
  }

  if (maxPrice) {
    filteredFoods = filteredFoods.filter(food => food.price <= parseFloat(maxPrice));
  }

  if (tags) {
    const tagList = tags.split(',');
    filteredFoods = filteredFoods.filter(food => 
      tagList.some(tag => food.tags.includes(tag))
    );
  }

  if (query) {
    const searchRegex = new RegExp(query, 'i');
    filteredFoods = filteredFoods.filter(food => 
      searchRegex.test(food.name) || 
      searchRegex.test(food.description) || 
      searchRegex.test(food.category)
    );
  }

  // Apply sorting
  if (sortBy) {
    const order = sortOrder === 'desc' ? -1 : 1;
    filteredFoods.sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return -1 * order;
      if (a[sortBy] > b[sortBy]) return 1 * order;
      return 0;
    });
  }

  // Apply pagination
  const pageNum = parseInt(page) || 1;
  const itemsPerPage = parseInt(limit) || filteredFoods.length;
  const startIndex = (pageNum - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFoods = filteredFoods.slice(startIndex, endIndex);
  
  // Return response with pagination metadata
  res.status(200).json({
    status: 'success',
    total: filteredFoods.length,
    page: pageNum,
    limit: itemsPerPage,
    totalPages: Math.ceil(filteredFoods.length / itemsPerPage),
    data: paginatedFoods,
    categories: FOOD_CATEGORIES,
    restaurants: RESTAURANTS
  });
}

function createFood(req, res) {
  try {
    const food = req.body;
    
    // Validate required fields
    if (!food.name || !food.price || !food.categoryId) {
      return res.status(400).json({ 
        error: 'Bad Request', 
        message: 'Required fields missing. Name, price, and categoryId are required.' 
      });
    }

    // Generate a new ID
    const lastId = MOCK_FOODS.length > 0 
      ? parseInt(MOCK_FOODS[MOCK_FOODS.length - 1].id.split('-')[1]) 
      : 0;
    const newId = `food-${String(lastId + 1).padStart(3, '0')}`;
    
    // Create new food with default values for optional fields
    const newFood = {
      id: newId,
      name: food.name,
      description: food.description || '',
      price: food.price,
      imageUrl: food.imageUrl || '/images/food-placeholder.jpg',
      restaurantName: food.restaurantName || '',
      restaurantId: food.restaurantId || '',
      category: food.category || '',
      categoryId: food.categoryId,
      rating: food.rating || 0,
      reviews: food.reviews || 0,
      isPopular: food.isPopular || false,
      isAvailable: food.isAvailable !== undefined ? food.isAvailable : true,
      preparationTime: food.preparationTime || 20,
      nutritionalInfo: food.nutritionalInfo || {
        calories: 0,
        protein: '0g',
        carbs: '0g',
        fat: '0g'
      },
      allergens: food.allergens || [],
      tags: food.tags || [],
      createdAt: new Date().toISOString()
    };

    // In a real app, you would add to database
    // For mock, just return success with the new food
    res.status(201).json({
      status: 'success',
      data: newFood
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
} 