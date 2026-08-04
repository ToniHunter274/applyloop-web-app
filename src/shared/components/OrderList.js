import { useState, useMemo } from 'react';
import { FiFilter, FiChevronDown, FiArrowRight, FiSearch } from 'react-icons/fi';
import OrderItem from './OrderItem';

const OrderList = ({ 
  orders, 
  onActionClick, 
  activeFilter = 'all',
  onFilterChange 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter orders based on status and search term
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // First filter by status
      const matchesStatus = 
        activeFilter === 'all' || 
        order.status.toLowerCase() === activeFilter.toLowerCase();
      
      // Then filter by search term
      const matchesSearch = 
        !searchTerm || 
        order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  }, [orders, activeFilter, searchTerm]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-medium text-gray-900">Order List</h2>
          
          <div className="flex w-full sm:w-auto items-center gap-2">
            {/* Search input */}
            <div className="relative w-full sm:w-auto">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Filter dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                <FiFilter className="text-gray-500" />
                <span>Filter</span>
                <FiChevronDown className="text-gray-500" />
              </button>
              
              <div className="absolute right-0 mt-1 py-1 bg-white rounded-lg shadow-lg z-10 w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <button 
                  className={`w-full text-left px-4 py-2 text-sm ${activeFilter === 'all' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                  onClick={() => onFilterChange && onFilterChange('all')}
                >
                  All Orders
                </button>
                <button 
                  className={`w-full text-left px-4 py-2 text-sm ${activeFilter === 'pending' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                  onClick={() => onFilterChange && onFilterChange('pending')}
                >
                  Pending
                </button>
                <button 
                  className={`w-full text-left px-4 py-2 text-sm ${activeFilter === 'delivered' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                  onClick={() => onFilterChange && onFilterChange('delivered')}
                >
                  Delivered
                </button>
                <button 
                  className={`w-full text-left px-4 py-2 text-sm ${activeFilter === 'canceled' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                  onClick={() => onFilterChange && onFilterChange('canceled')}
                >
                  Canceled
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <OrderItem
              key={`${order.id}-${order.quantity}`}
              image={order.image}
              title={order.title}
              orderId={order.id}
              price={order.price}
              quantity={order.quantity}
              status={order.status}
              customerName={order.customerName}
              location={order.location}
              onActionClick={(action) => onActionClick(order.id, action)}
            />
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">
            {searchTerm ? 'No orders match your search.' : 'No orders found with the selected filter.'}
          </div>
        )}
      </div>

      {filteredOrders.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {filteredOrders.length} of {orders.length} orders
            </p>
            <button className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center transition-all hover:translate-x-1">
              View All <FiArrowRight className="ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderList; 