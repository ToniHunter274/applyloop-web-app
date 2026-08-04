import { useState, useEffect } from 'react';
import SEO from '../shared/components/SEO';
import DashboardLayout from '../shared/components/DashboardLayout';
import { FiSearch, FiDownload, FiFilter, FiCalendar, FiArrowDown, FiArrowUp } from 'react-icons/fi';

// Mock data for orders
const MOCK_ORDERS = [
  {
    id: 'ord-001',
    orderNumber: 'ORD-2023-001',
    items: [
      {
        id: 'item-001',
        foodId: 'food-001',
        name: 'Double Cheese Burger',
        price: 1200,
        quantity: 2,
        notes: 'Extra cheese, no onions',
        modifiers: ['Extra cheese'],
        subtotal: 2400
      }
    ],
    image: '/images/food-placeholder.jpg',
    title: 'Double Cheese Burger',
    price: 1200,
    quantity: 2,
    status: 'Pending',
    paymentStatus: 'Pending',
    paymentMethod: 'Card',
    customerId: 'cust-001',
    customerName: 'Alex Johnson',
    customerPhone: '(+234) 803-123-4567',
    customerEmail: 'alex.johnson@gmail.com',
    restaurantId: 'rest-001',
    restaurantName: 'Burger Express',
    deliveryAddressId: 'addr-001',
    location: 'Downtown, Lagos',
    fullAddress: '15 Marina Road, Lagos Island, Lagos',
    date: '2023-10-15T14:30:00Z',
    createdAt: '2023-10-15T14:25:33Z',
    estimatedDeliveryTime: '2023-10-15T15:15:00Z',
    deliveredAt: null,
    riderId: 'rider-003',
    riderName: 'Emmanuel Okonkwo',
    subtotal: 2400,
    deliveryFee: 500,
    serviceCharge: 200,
    discount: 0,
    totalAmount: 3100,
    rating: null,
    feedback: null,
    tags: ['burger', 'lunch']
  },
  {
    id: 'ord-002',
    orderNumber: 'ORD-2023-002',
    items: [
      {
        id: 'item-002',
        foodId: 'food-008',
        name: 'Pepperoni Pizza',
        price: 3500,
        quantity: 1,
        notes: 'Extra pepperoni',
        modifiers: ['Extra pepperoni'],
        subtotal: 3500
      }
    ],
    image: '/images/food-placeholder.jpg',
    title: 'Pepperoni Pizza',
    price: 3500,
    quantity: 1,
    status: 'Delivered',
    paymentStatus: 'Paid',
    paymentMethod: 'Cash on Delivery',
    customerId: 'cust-002',
    customerName: 'Sarah Williams',
    customerPhone: '(+234) 802-345-6789',
    customerEmail: 'sarah.williams@gmail.com',
    restaurantId: 'rest-004',
    restaurantName: 'Pizza Palace',
    deliveryAddressId: 'addr-002',
    location: 'Ikeja, Lagos',
    fullAddress: '23 Allen Avenue, Ikeja, Lagos',
    date: '2023-10-14T12:15:00Z',
    createdAt: '2023-10-14T12:05:22Z',
    estimatedDeliveryTime: '2023-10-14T13:00:00Z',
    deliveredAt: '2023-10-14T12:55:18Z',
    riderId: 'rider-001',
    riderName: 'John Adebayo',
    subtotal: 3500,
    deliveryFee: 600,
    serviceCharge: 250,
    discount: 0,
    totalAmount: 4350,
    rating: 5,
    feedback: 'Fast delivery and delicious pizza!',
    tags: ['pizza', 'lunch']
  },
  {
    id: 'ord-003',
    orderNumber: 'ORD-2023-003',
    items: [
      {
        id: 'item-003',
        foodId: 'food-012',
        name: 'Caesar Salad',
        price: 1800,
        quantity: 1,
        notes: 'No croutons',
        modifiers: ['No croutons'],
        subtotal: 1800
      }
    ],
    image: '/images/food-placeholder.jpg',
    title: 'Caesar Salad',
    price: 1800,
    quantity: 1,
    status: 'Canceled',
    paymentStatus: 'Refunded',
    paymentMethod: 'Card',
    customerId: 'cust-003',
    customerName: 'Michael Brown',
    customerPhone: '(+234) 805-678-9012',
    customerEmail: 'michael.brown@gmail.com',
    restaurantId: 'rest-002',
    restaurantName: 'Healthy Bites',
    deliveryAddressId: 'addr-003',
    location: 'Lekki, Lagos',
    fullAddress: '45 Admiralty Way, Lekki Phase 1, Lagos',
    date: '2023-10-13T18:45:00Z',
    createdAt: '2023-10-13T18:40:11Z',
    estimatedDeliveryTime: '2023-10-13T19:30:00Z',
    deliveredAt: null,
    riderId: null,
    riderName: null,
    subtotal: 1800,
    deliveryFee: 700,
    serviceCharge: 150,
    discount: 0,
    totalAmount: 2650,
    rating: null,
    feedback: 'Had to cancel due to emergency',
    tags: ['salad', 'healthy', 'dinner']
  },
  {
    id: 'ord-004',
    orderNumber: 'ORD-2023-004',
    items: [
      {
        id: 'item-004',
        foodId: 'food-007',
        name: 'Grilled Chicken',
        price: 2500,
        quantity: 2,
        notes: 'Well done, extra spicy',
        modifiers: ['Extra spicy'],
        subtotal: 5000
      }
    ],
    image: '/images/food-placeholder.jpg',
    title: 'Grilled Chicken',
    price: 2500,
    quantity: 2,
    status: 'Pending',
    paymentStatus: 'Pending',
    paymentMethod: 'Card',
    customerId: 'cust-004',
    customerName: 'Jennifer Lee',
    customerPhone: '(+234) 809-012-3456',
    customerEmail: 'jennifer.lee@gmail.com',
    restaurantId: 'rest-003',
    restaurantName: 'Chicken Republic',
    deliveryAddressId: 'addr-004',
    location: 'Victoria Island, Lagos',
    fullAddress: '10 Kofo Abayomi Street, Victoria Island, Lagos',
    date: '2023-10-12T09:20:00Z',
    createdAt: '2023-10-12T09:15:44Z',
    estimatedDeliveryTime: '2023-10-12T10:05:00Z',
    deliveredAt: null,
    riderId: 'rider-002',
    riderName: 'Faith Okafor',
    subtotal: 5000,
    deliveryFee: 550,
    serviceCharge: 300,
    discount: 0,
    totalAmount: 5850,
    rating: null,
    feedback: null,
    tags: ['chicken', 'grilled', 'breakfast']
  },
  {
    id: 'ord-005',
    orderNumber: 'ORD-2023-005',
    items: [
      {
        id: 'item-005',
        foodId: 'food-003',
        name: 'Spaghetti Bolognese',
        price: 1950,
        quantity: 1,
        notes: 'Extra sauce',
        modifiers: ['Extra sauce'],
        subtotal: 1950
      }
    ],
    image: '/images/food-placeholder.jpg',
    title: 'Spaghetti Bolognese',
    price: 1950,
    quantity: 1,
    status: 'Delivered',
    paymentStatus: 'Paid',
    paymentMethod: 'Online Payment',
    customerId: 'cust-005',
    customerName: 'David Wilson',
    customerPhone: '(+234) 806-789-0123',
    customerEmail: 'david.wilson@gmail.com',
    restaurantId: 'rest-005',
    restaurantName: 'Italian Delight',
    deliveryAddressId: 'addr-005',
    location: 'Yaba, Lagos',
    fullAddress: '32 Herbert Macaulay Way, Yaba, Lagos',
    date: '2023-10-11T16:10:00Z',
    createdAt: '2023-10-11T16:05:30Z',
    estimatedDeliveryTime: '2023-10-11T16:55:00Z',
    deliveredAt: '2023-10-11T16:50:22Z',
    riderId: 'rider-004',
    riderName: 'Victor Eze',
    subtotal: 1950,
    deliveryFee: 500,
    serviceCharge: 150,
    discount: 200,
    totalAmount: 2400,
    rating: 4,
    feedback: 'Good pasta, delivery on time',
    tags: ['pasta', 'italian', 'dinner']
  },
  {
    id: 'ord-006',
    orderNumber: 'ORD-2023-006',
    items: [
      {
        id: 'item-006',
        foodId: 'food-009',
        name: 'Club Sandwich',
        price: 1500,
        quantity: 3,
        notes: 'No mayo',
        modifiers: ['No mayo'],
        subtotal: 4500
      }
    ],
    image: '/images/food-placeholder.jpg',
    title: 'Club Sandwich',
    price: 1500,
    quantity: 3,
    status: 'Pending',
    paymentStatus: 'Pending',
    paymentMethod: 'Card',
    customerId: 'cust-006',
    customerName: 'Robert Taylor',
    customerPhone: '(+234) 801-234-5678',
    customerEmail: 'robert.taylor@gmail.com',
    restaurantId: 'rest-006',
    restaurantName: 'Sandwich Corner',
    deliveryAddressId: 'addr-006',
    location: 'Surulere, Lagos',
    fullAddress: '24 Adelabu Street, Surulere, Lagos',
    date: '2023-10-10T13:40:00Z',
    createdAt: '2023-10-10T13:35:12Z',
    estimatedDeliveryTime: '2023-10-10T14:25:00Z',
    deliveredAt: null,
    riderId: 'rider-005',
    riderName: 'Blessing Adekunle',
    subtotal: 4500,
    deliveryFee: 450,
    serviceCharge: 250,
    discount: 0,
    totalAmount: 5200,
    rating: null,
    feedback: null,
    tags: ['sandwich', 'lunch']
  },
  {
    id: 'ord-007',
    orderNumber: 'ORD-2023-007',
    items: [
      {
        id: 'item-007',
        foodId: 'food-010',
        name: 'T-Bone Steak',
        price: 4500,
        quantity: 1,
        notes: 'Medium rare',
        modifiers: ['Medium rare'],
        subtotal: 4500
      }
    ],
    image: '/images/food-placeholder.jpg',
    title: 'T-Bone Steak',
    price: 4500,
    quantity: 1,
    status: 'Delivered',
    paymentStatus: 'Paid',
    paymentMethod: 'Card',
    customerId: 'cust-007',
    customerName: 'Emily Davis',
    customerPhone: '(+234) 808-901-2345',
    customerEmail: 'emily.davis@gmail.com',
    restaurantId: 'rest-007',
    restaurantName: 'Steakhouse Grill',
    deliveryAddressId: 'addr-007',
    location: 'Gbagada, Lagos',
    fullAddress: '56 Diya Street, Gbagada, Lagos',
    date: '2023-10-09T19:25:00Z',
    createdAt: '2023-10-09T19:20:08Z',
    estimatedDeliveryTime: '2023-10-09T20:10:00Z',
    deliveredAt: '2023-10-09T20:05:33Z',
    riderId: 'rider-001',
    riderName: 'John Adebayo',
    subtotal: 4500,
    deliveryFee: 700,
    serviceCharge: 300,
    discount: 0,
    totalAmount: 5500,
    rating: 5,
    feedback: 'Amazing steak and very quick delivery!',
    tags: ['steak', 'dinner', 'premium']
  },
  {
    id: 'ord-008',
    orderNumber: 'ORD-2023-008',
    items: [
      {
        id: 'item-008',
        foodId: 'food-011',
        name: 'Creamy Mushroom Soup',
        price: 1200,
        quantity: 2,
        notes: 'Extra mushrooms',
        modifiers: ['Extra mushrooms'],
        subtotal: 2400
      }
    ],
    image: '/images/food-placeholder.jpg',
    title: 'Creamy Mushroom Soup',
    price: 1200,
    quantity: 2,
    status: 'Canceled',
    paymentStatus: 'Refunded',
    paymentMethod: 'Online Payment',
    customerId: 'cust-008',
    customerName: 'Mark Johnson',
    customerPhone: '(+234) 807-890-1234',
    customerEmail: 'mark.johnson@gmail.com',
    restaurantId: 'rest-008',
    restaurantName: 'Soup Haven',
    deliveryAddressId: 'addr-008',
    location: 'Ajah, Lagos',
    fullAddress: '18 Addo Road, Ajah, Lagos',
    date: '2023-10-08T11:50:00Z',
    createdAt: '2023-10-08T11:45:55Z',
    estimatedDeliveryTime: '2023-10-08T12:35:00Z',
    deliveredAt: null,
    riderId: null,
    riderName: null,
    subtotal: 2400,
    deliveryFee: 800,
    serviceCharge: 200,
    discount: 0,
    totalAmount: 3400,
    rating: null,
    feedback: 'Order took too long, had to cancel',
    tags: ['soup', 'lunch']
  }
];

// Order statuses for filtering
const ORDER_STATUSES = [
  { id: 'all', name: 'All Orders' },
  { id: 'pending', name: 'Pending' },
  { id: 'delivered', name: 'Delivered' },
  { id: 'canceled', name: 'Canceled' }
];

// Riders data
const RIDERS = [
  { id: 'rider-001', name: 'John Adebayo', phone: '(+234) 801-111-2222', rating: 4.8, activeOrders: 2 },
  { id: 'rider-002', name: 'Faith Okafor', phone: '(+234) 802-222-3333', rating: 4.7, activeOrders: 1 },
  { id: 'rider-003', name: 'Emmanuel Okonkwo', phone: '(+234) 803-333-4444', rating: 4.9, activeOrders: 3 },
  { id: 'rider-004', name: 'Victor Eze', phone: '(+234) 804-444-5555', rating: 4.6, activeOrders: 0 },
  { id: 'rider-005', name: 'Blessing Adekunle', phone: '(+234) 805-555-6666', rating: 4.8, activeOrders: 2 }
];

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusStyles = () => {
    switch(status?.toLowerCase()) {
      case 'pending':
        return 'bg-amber-50 text-amber-500 border-amber-200';
      case 'delivered':
        return 'bg-green-50 text-green-500 border-green-200';
      case 'canceled':
        return 'bg-red-50 text-red-500 border-red-200';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyles()}`}>
      {status}
    </span>
  );
};

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedStatus, setSelectedStatus] = useState('all');

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

  // Filter orders based on search term and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || 
      order.status.toLowerCase() === selectedStatus.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  // Sort orders based on column and direction
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortColumn === 'date') {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortColumn === 'price') {
      return sortDirection === 'asc' ? a.price - b.price : b.price - a.price;
    } else if (sortColumn === 'customer') {
      return sortDirection === 'asc' 
        ? a.customerName.localeCompare(b.customerName) 
        : b.customerName.localeCompare(a.customerName);
    }
    return 0;
  });

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

  // Handler for sorting
  const handleSort = (column) => {
    if (sortColumn === column) {
      // If already sorting by this column, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Otherwise, sort by the new column in ascending order
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (column) => {
    if (sortColumn !== column) return null;
    
    return sortDirection === 'asc' 
      ? <FiArrowUp className="inline ml-1" /> 
      : <FiArrowDown className="inline ml-1" />;
  };

  return (
    <DashboardLayout>
      <SEO 
        title="Order List" 
        description="View and manage all customer orders" 
      />
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Order List</h1>
            <p className="text-gray-600">View and manage all customer orders</p>
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            {/* Search */}
            <div className="relative w-full md:w-auto">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full md:w-80 pl-10 p-2.5"
                placeholder="Search orders by ID, customer or food item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              {/* Status filter */}
              <select
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="delivered">Delivered</option>
                <option value="canceled">Canceled</option>
              </select>

              {/* Date filter */}
              <button className="inline-flex items-center text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-3 py-2.5">
                <FiCalendar className="mr-2" />
                Date Range
              </button>

              {/* Export */}
              <button className="inline-flex items-center text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-3 py-2.5">
                <FiDownload className="mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Order Table */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('customer')}
                    >
                      Customer {renderSortIcon('customer')}
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('date')}
                    >
                      Date {renderSortIcon('date')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                      onClick={() => handleSort('price')}
                    >
                      Amount {renderSortIcon('price')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedOrders.length > 0 ? (
                    sortedOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden">
                              <img 
                                src={order.image} 
                                alt={order.title} 
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{order.title}</div>
                              <div className="text-sm text-blue-600">#{order.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                          <div className="text-sm text-gray-500">{order.location}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{new Date(order.date).toLocaleDateString()}</div>
                          <div className="text-sm text-gray-500">{new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="font-bold text-gray-900">₦{order.price.toLocaleString()}</div>
                          <div className="text-gray-500">x{order.quantity}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            onClick={() => handleOrderAction(order.id, 'view')}
                          >
                            View
                          </button>
                          {order.status === 'Pending' && (
                            <>
                              <button 
                                className="text-green-600 hover:text-green-900 mr-3"
                                onClick={() => handleOrderAction(order.id, 'accept')}
                              >
                                Accept
                              </button>
                              <button 
                                className="text-red-600 hover:text-red-900"
                                onClick={() => handleOrderAction(order.id, 'reject')}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-500">
                        No orders found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Previous
                </button>
                <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">{sortedOrders.length}</span> of{' '}
                    <span className="font-medium">{sortedOrders.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      <span className="sr-only">Previous</span>
                      &laquo;
                    </button>
                    <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-600">
                      1
                    </button>
                    <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                      2
                    </button>
                    <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                      3
                    </button>
                    <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                      <span className="sr-only">Next</span>
                      &raquo;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
} 