// Centralized food data for the application
// This file exports all food-related mock data for use in components and API routes

// Mock food data with Nigerian dishes
export const MOCK_FOODS = [
  {
    id: "food-001",
    name: 'Jollof Rice with Chicken',
    description: 'Spicy and flavorful long-grain rice cooked in tomato sauce with chicken, served with fried plantains',
    price: 2500,
    imageUrl: '/images/food-placeholder.jpg',
    restaurantName: 'Lagos Kitchen',
    restaurantId: "rest-001",
    category: 'Main Dish',
    categoryId: "cat-001",
    rating: 4.8,
    reviews: 124,
    isPopular: true,
    isAvailable: true,
    preparationTime: 25, // in minutes
    nutritionalInfo: {
      calories: 650,
      protein: '35g',
      carbs: '80g',
      fat: '15g'
    },
    allergens: ['None'],
    tags: ['spicy', 'rice', 'chicken']
  },
  {
    id: "food-002",
    name: 'Pounded Yam and Egusi Soup',
    description: 'Smooth pounded yam served with rich melon seed soup, assorted meat, dried fish and vegetables',
    price: 3200,
    imageUrl: '/images/food-placeholder.jpg',
    restaurantName: 'Naija Delicacies',
    restaurantId: "rest-002",
    category: 'Main Dish',
    categoryId: "cat-001",
    rating: 4.7,
    reviews: 98,
    isPopular: true,
    isAvailable: true,
    preparationTime: 35,
    nutritionalInfo: {
      calories: 820,
      protein: '40g',
      carbs: '95g',
      fat: '30g'
    },
    allergens: ['Seeds', 'Fish'],
    tags: ['soup', 'yam', 'traditional']
  },
  {
    id: "food-003",
    name: 'Suya Platter',
    description: 'Spicy grilled beef skewers marinated in groundnut spice mix, served with sliced onions, tomatoes and hot pepper sauce',
    price: 1800,
    imageUrl: '/images/food-placeholder.jpg',
    restaurantName: 'Abuja Grill',
    restaurantId: "rest-003",
    category: 'Appetizer',
    categoryId: "cat-002",
    rating: 4.9,
    reviews: 156,
    isPopular: true,
    isAvailable: true,
    preparationTime: 20,
    nutritionalInfo: {
      calories: 480,
      protein: '45g',
      carbs: '10g',
      fat: '28g'
    },
    allergens: ['Peanuts'],
    tags: ['spicy', 'beef', 'grilled']
  },
  {
    id: "food-004",
    name: 'Akara and Pap',
    description: 'Crispy bean fritters served with smooth custard, topped with honey or sugar to taste',
    price: 1200,
    imageUrl: '/images/food-placeholder.jpg',
    restaurantName: 'Morning Delights',
    restaurantId: "rest-004",
    category: 'Breakfast',
    categoryId: "cat-003",
    rating: 4.5,
    reviews: 87,
    isPopular: false,
    isAvailable: true,
    preparationTime: 15,
    nutritionalInfo: {
      calories: 450,
      protein: '12g',
      carbs: '65g',
      fat: '18g'
    },
    allergens: ['Beans'],
    tags: ['breakfast', 'vegetarian']
  },
  {
    id: "food-005",
    name: 'Catfish Pepper Soup',
    description: 'Hot and spicy broth made with fresh catfish, traditional herbs and spices, served with a side of boiled yam',
    price: 2800,
    imageUrl: '/images/food-placeholder.jpg',
    restaurantName: 'Calabar Kitchen',
    restaurantId: "rest-005",
    category: 'Soup',
    categoryId: "cat-004",
    rating: 4.6,
    reviews: 112,
    isPopular: true,
    isAvailable: true,
    preparationTime: 30,
    nutritionalInfo: {
      calories: 380,
      protein: '32g',
      carbs: '28g',
      fat: '12g'
    },
    allergens: ['Fish'],
    tags: ['spicy', 'soup', 'seafood']
  },
  {
    id: "food-006",
    name: 'Moi Moi Deluxe',
    description: 'Steamed bean pudding with boiled eggs, sardines, and ground crayfish, wrapped in banana leaves',
    price: 1500,
    imageUrl: '/images/food-placeholder.jpg',
    restaurantName: 'Bean Masters',
    restaurantId: "rest-006",
    category: 'Side Dish',
    categoryId: "cat-005",
    rating: 4.4,
    reviews: 78,
    isPopular: false,
    isAvailable: true,
    preparationTime: 40,
    nutritionalInfo: {
      calories: 420,
      protein: '25g',
      carbs: '45g',
      fat: '16g'
    },
    allergens: ['Beans', 'Eggs', 'Fish'],
    tags: ['beans', 'protein', 'steamed']
  },
  {
    id: "food-007",
    name: 'Asun (Spicy Goat Meat)',
    description: 'Grilled and spiced goat meat sautéed with hot peppers, onions and bell peppers',
    price: 3500,
    imageUrl: '/images/food-placeholder.jpg',
    restaurantName: 'Meat Palace',
    restaurantId: "rest-007",
    category: 'Main Dish',
    categoryId: "cat-001",
    rating: 4.8,
    reviews: 105,
    isPopular: true,
    isAvailable: true,
    preparationTime: 35,
    nutritionalInfo: {
      calories: 580,
      protein: '50g',
      carbs: '8g',
      fat: '35g'
    },
    allergens: ['None'],
    tags: ['spicy', 'meat', 'grilled']
  },
  {
    id: "food-008",
    name: 'Zobo Drink',
    description: 'Refreshing hibiscus drink infused with pineapple, ginger and cloves, served chilled',
    price: 700,
    imageUrl: '/images/food-placeholder.jpg',
    restaurantName: 'Nigerian Beverages',
    restaurantId: "rest-008",
    category: 'Drink',
    categoryId: "cat-006",
    rating: 4.5,
    reviews: 92,
    isPopular: false,
    isAvailable: true,
    preparationTime: 10,
    nutritionalInfo: {
      calories: 120,
      protein: '0g',
      carbs: '30g',
      fat: '0g'
    },
    allergens: ['None'],
    tags: ['drink', 'refreshing', 'hibiscus']
  },
  {
    id: "food-009",
    name: 'Efo Riro with Assorted Meat',
    description: 'Rich vegetable soup made with spinach, palm oil, locust beans, and assorted meat cuts',
    price: 2800,
    imageUrl: '/images/food-placeholder.jpg',
    restaurantName: 'Yoruba Tastes',
    restaurantId: "rest-009",
    category: 'Soup',
    categoryId: "cat-004",
    rating: 4.7,
    reviews: 89,
    isPopular: false,
    isAvailable: true,
    preparationTime: 30,
    nutritionalInfo: {
      calories: 550,
      protein: '38g',
      carbs: '15g',
      fat: '42g'
    },
    allergens: ['None'],
    tags: ['vegetable', 'soup', 'spinach']
  },
  {
    id: "food-010",
    name: 'Ewa Agoyin with Agege Bread',
    description: 'Mashed beans served with spicy pepper sauce and soft Nigerian bread',
    price: 1600,
    imageUrl: '/images/food-placeholder.jpg',
    restaurantName: 'Lagos Street Food',
    restaurantId: "rest-010",
    category: 'Breakfast',
    categoryId: "cat-003",
    rating: 4.6,
    reviews: 76,
    isPopular: true,
    isAvailable: true,
    preparationTime: 20,
    nutritionalInfo: {
      calories: 520,
      protein: '22g',
      carbs: '85g',
      fat: '10g'
    },
    allergens: ['Beans', 'Gluten'],
    tags: ['beans', 'spicy', 'bread']
  },
  {
    id: "food-011",
    name: 'Dodo (Fried Plantains)',
    description: 'Sweet ripe plantains, deep-fried to golden perfection',
    price: 800,
    imageUrl: '/images/food-placeholder.jpg',
    restaurantName: 'Quick Bites',
    restaurantId: "rest-011",
    category: 'Side Dish',
    categoryId: "cat-005",
    rating: 4.4,
    reviews: 65,
    isPopular: false,
    isAvailable: true,
    preparationTime: 10,
    nutritionalInfo: {
      calories: 320,
      protein: '1g',
      carbs: '60g',
      fat: '12g'
    },
    allergens: ['None'],
    tags: ['plantain', 'sweet', 'fried']
  },
  {
    id: "food-012",
    name: 'Chapman Cocktail',
    description: 'Sweet non-alcoholic cocktail with mixed fruit flavors, grenadine and a hint of bitters',
    price: 1000,
    imageUrl: '/images/food-placeholder.jpg',
    restaurantName: 'Nigerian Beverages',
    restaurantId: "rest-008",
    category: 'Drink',
    categoryId: "cat-006",
    rating: 4.7,
    reviews: 83,
    isPopular: true,
    isAvailable: true,
    preparationTime: 5,
    nutritionalInfo: {
      calories: 180,
      protein: '0g',
      carbs: '45g',
      fat: '0g'
    },
    allergens: ['None'],
    tags: ['drink', 'cocktail', 'sweet']
  }
];

// Categories data for easier management
export const FOOD_CATEGORIES = [
  { id: "cat-001", name: "Main Dish", iconUrl: '/icons/main-dish.png' },
  { id: "cat-002", name: "Appetizer", iconUrl: '/icons/appetizer.png' },
  { id: "cat-003", name: "Breakfast", iconUrl: '/icons/breakfast.png' },
  { id: "cat-004", name: "Soup", iconUrl: '/icons/soup.png' },
  { id: "cat-005", name: "Side Dish", iconUrl: '/icons/side-dish.png' },
  { id: "cat-006", name: "Drink", iconUrl: '/icons/drink.png' }
];

// Restaurants data
export const RESTAURANTS = [
  { id: "rest-001", name: "Lagos Kitchen", rating: 4.7, location: "Lagos", cuisineType: "Nigerian", priceRange: "₦₦", deliveryTime: "30-45 min" },
  { id: "rest-002", name: "Naija Delicacies", rating: 4.6, location: "Abuja", cuisineType: "Nigerian", priceRange: "₦₦₦", deliveryTime: "35-50 min" },
  { id: "rest-003", name: "Abuja Grill", rating: 4.8, location: "Abuja", cuisineType: "BBQ", priceRange: "₦₦", deliveryTime: "25-40 min" },
  { id: "rest-004", name: "Morning Delights", rating: 4.5, location: "Lagos", cuisineType: "Breakfast", priceRange: "₦", deliveryTime: "20-35 min" },
  { id: "rest-005", name: "Calabar Kitchen", rating: 4.7, location: "Calabar", cuisineType: "Southern Nigerian", priceRange: "₦₦", deliveryTime: "30-45 min" },
  { id: "rest-006", name: "Bean Masters", rating: 4.4, location: "Lagos", cuisineType: "Vegetarian", priceRange: "₦", deliveryTime: "25-40 min" },
  { id: "rest-007", name: "Meat Palace", rating: 4.7, location: "Port Harcourt", cuisineType: "BBQ", priceRange: "₦₦₦", deliveryTime: "35-50 min" },
  { id: "rest-008", name: "Nigerian Beverages", rating: 4.6, location: "Lagos", cuisineType: "Drinks", priceRange: "₦", deliveryTime: "15-30 min" },
  { id: "rest-009", name: "Yoruba Tastes", rating: 4.7, location: "Ibadan", cuisineType: "Western Nigerian", priceRange: "₦₦", deliveryTime: "30-45 min" },
  { id: "rest-010", name: "Lagos Street Food", rating: 4.5, location: "Lagos", cuisineType: "Street Food", priceRange: "₦", deliveryTime: "20-35 min" },
  { id: "rest-011", name: "Quick Bites", rating: 4.3, location: "Lagos", cuisineType: "Fast Food", priceRange: "₦", deliveryTime: "15-30 min" }
]; 