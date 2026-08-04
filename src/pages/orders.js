import { useState, useEffect } from 'react';
import SEO from '../shared/components/SEO';
import DashboardLayout from '../shared/components/DashboardLayout';
import OrderList from '../shared/components/OrderList';
import { FiClock } from 'react-icons/fi';

// Mock data for orders
const MOCK_ORDERS = [
  {
    id: 'ORD-2023-001',
    image: '/images/food-placeholder.jpg',
    title: 'Double Cheese Burger',
    price: 1200,
    quantity: 2,
    status: 'Pending',
    customerName: 'Alex Johnson',
    location: 'Downtown, Lagos',
  },
  {
    id: 'ORD-2023-002',
    image: '/images/food-placeholder.jpg',
    title: 'Pepperoni Pizza',
    price: 3500,
    quantity: 1,
    status: 'Delivered',
    customerName: 'Sarah Williams',
    location: 'Ikeja, Lagos',
  },
  {
    id: 'ORD-2023-003',
    image: '/images/food-placeholder.jpg',
    title: 'Caesar Salad',
    price: 1800,
    quantity: 1,
    status: 'Canceled',
    customerName: 'Michael Brown',
    location: 'Lekki, Lagos',
  },
  {
    id: 'ORD-2023-004',
    image: '/images/food-placeholder.jpg',
    title: 'Grilled Chicken',
    price: 2500,
    quantity: 2,
    status: 'Pending',
    customerName: 'Jennifer Lee',
    location: 'Victoria Island, Lagos',
  },
  {
    id: 'ORD-2023-005',
    image: '/images/food-placeholder.jpg',
    title: 'Spaghetti Bolognese',
    price: 1950,
    quantity: 1,
    status: 'Delivered',
    customerName: 'David Wilson',
    location: 'Yaba, Lagos',
  }
];

// Order stats card component
const OrderStatsCard = ({ title, value, icon, bgColor, textColor }) => (
  <div className="bg-white rounded-lg shadow-md p-4 flex items-center">
    <div className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center mr-4`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`text-xl font-bold ${textColor}`}>{value}</p>
    </div>
  </div>
);

// FilterButton component
const FilterButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    {label}
  </button>
);

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    // Simulate API fetch
    const fetchOrders = () => {
      setTimeout(() => {
        setOrders(MOCK_ORDERS);
        setLoading(false);
      }, 800);
    };

    fetchOrders();
  }, []);

  // Calculate stats
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(order => order.status.toLowerCase() === 'pending').length;
  const deliveredOrders = orders.filter(order => order.status.toLowerCase() === 'delivered').length;
  const canceledOrders = orders.filter(order => order.status.toLowerCase() === 'canceled').length;

  // Handler for order item action button
  const handleOrderAction = (orderId, action) => {
    // In a real app, you would call an API to update the order status
    console.log(`Action '${action}' clicked for order: ${orderId}`);
    
    switch(action) {
      case 'accept':
        alert(`Order #${orderId} accepted successfully!`);
        break;
      case 'reject':
        alert(`Order #${orderId} rejected!`);
        break;
      case 'view':
        alert(`View details for order #${orderId}`);
        break;
      default:
        // Just showing the action menu
        break;
    }
  };

  return (
    <DashboardLayout>
      <SEO 
        title="Orders" 
        description="Manage your restaurant's orders" 
      />
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600">Manage and track all your food orders</p>
          </div>

          {/* Order Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <OrderStatsCard 
              title="Total Orders" 
              value={totalOrders}
              icon={<FiClock className="text-white text-xl" />}
              bgColor="bg-blue-600"
              textColor="text-blue-600"
            />
            <OrderStatsCard 
              title="Pending Orders" 
              value={pendingOrders}
              icon={<FiClock className="text-white text-xl" />}
              bgColor="bg-amber-500"
              textColor="text-amber-500"
            />
            <OrderStatsCard 
              title="Delivered Orders" 
              value={deliveredOrders}
              icon={<FiClock className="text-white text-xl" />}
              bgColor="bg-green-500"
              textColor="text-green-500"
            />
            <OrderStatsCard 
              title="Canceled Orders" 
              value={canceledOrders}
              icon={<FiClock className="text-white text-xl" />}
              bgColor="bg-red-500"
              textColor="text-red-500"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex space-x-2 overflow-x-auto pb-4 mb-4">
            <FilterButton 
              label="All Orders" 
              active={activeFilter === 'all'} 
              onClick={() => setActiveFilter('all')}
            />
            <FilterButton 
              label="Pending" 
              active={activeFilter === 'pending'} 
              onClick={() => setActiveFilter('pending')}
            />
            <FilterButton 
              label="Delivered" 
              active={activeFilter === 'delivered'} 
              onClick={() => setActiveFilter('delivered')}
            />
            <FilterButton 
              label="Canceled" 
              active={activeFilter === 'canceled'} 
              onClick={() => setActiveFilter('canceled')}
            />
          </div>
          
          {/* Order List Component */}
          <OrderList 
            orders={orders}
            onActionClick={handleOrderAction}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </>
      )}
    </DashboardLayout>
  );
} 