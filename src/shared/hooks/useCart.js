import { useState, useEffect, useContext, createContext } from 'react';

/**
 * Custom hook for managing shopping cart functionality
 * This hook can be used in both web and mobile apps
 * 
 * @returns {Object} Cart methods and state
 */

// Create context
const CartContext = createContext();

// Cart provider component
export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem('orderlyCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
        localStorage.removeItem('orderlyCart');
      }
    }
  }, []);

  // Update cart in localStorage and recalculate totals when items change
  useEffect(() => {
    localStorage.setItem('orderlyCart', JSON.stringify(items));
    
    // Calculate totals
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    setCount(itemCount);
    setTotal(totalPrice);
  }, [items]);

  // Add item to cart
  const addItem = (item) => {
    setItems(prevItems => {
      // Check if item already exists in cart
      const existingItem = prevItems.find(i => i.id === item.id);
      
      if (existingItem) {
        // Increase quantity if item exists
        return prevItems.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i
        );
      } else {
        // Add new item with quantity
        return [...prevItems, { ...item, quantity: item.quantity || 1 }];
      }
    });
  };

  // Update item quantity
  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  // Remove item from cart
  const removeItem = (id) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  // Clear entire cart
  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        count,
        total,
        addItem,
        updateQuantity,
        removeItem,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Hook to use cart context
const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default useCart; 