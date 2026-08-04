import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiShoppingCart, FiX, FiPlus, FiMinus, FiTrash2 } from 'react-icons/fi';
import useCart from '../hooks/useCart';

const CartMini = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { items, count, total, updateQuantity, removeItem } = useCart();

  const toggleCart = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      {/* Cart trigger button */}
      <button
        onClick={toggleCart}
        className="relative p-2 text-gray-600 hover:text-blue-600 focus:outline-none"
      >
        <FiShoppingCart className="h-6 w-6" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
            {count}
          </span>
        )}
      </button>

      {/* Cart dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 animate-fadeIn">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Your Cart ({count} items)</h3>
              <button
                onClick={toggleCart}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              Your cart is empty
            </div>
          ) : (
            <>
              <div className="max-h-80 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="p-4 border-b flex items-center">
                    <div className="relative h-16 w-16 flex-shrink-0 rounded overflow-hidden">
                      <Image
                        src={item.imageUrl || '/images/food-placeholder.jpg'}
                        alt={item.name}
                        layout="fill"
                        objectFit="cover"
                      />
                    </div>

                    <div className="ml-3 flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-gray-500 text-xs">{item.restaurantName}</p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="font-medium text-blue-600">
                          ₦{item.price.toLocaleString()}
                        </p>

                        <div className="flex items-center">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="text-gray-500 hover:text-blue-600 p-1"
                          >
                            <FiMinus className="h-4 w-4" />
                          </button>
                          <span className="mx-1 text-sm w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="text-gray-500 hover:text-blue-600 p-1"
                          >
                            <FiPlus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="ml-2 text-red-500 hover:text-red-700 p-1"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-bold">₦{total.toLocaleString()}</span>
                </div>
                <Link href="/checkout">
                  <a 
                    className="block w-full bg-blue-600 text-white text-center py-2 rounded-md hover:bg-blue-700 transition duration-200"
                    onClick={toggleCart}
                  >
                    Proceed to Checkout
                  </a>
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CartMini; 