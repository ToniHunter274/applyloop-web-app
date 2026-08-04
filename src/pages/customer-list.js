import { useState, useEffect } from 'react';
import { FiSearch, FiDownload, FiMoreVertical, FiChevronLeft, FiChevronRight, FiUsers, FiUserPlus, FiDollarSign, FiShoppingBag, FiFilter, FiRefreshCw } from 'react-icons/fi';
import SEO from '../shared/components/SEO';
import DashboardLayout from '../shared/components/DashboardLayout';

// Mock customer data
const MOCK_CUSTOMERS = [
  {
    id: 'cust-001',
    customerNumber: '#555228',
    registrationDate: '2020-03-26T10:15:30Z',
    date: '26 March 2020',
    name: 'David Harrison',
    firstName: 'David',
    lastName: 'Harrison',
    email: 'david.harrison@gmail.com',
    phone: '(+234) 803-123-4567',
    address: '11 Church Road, Lekki, Lagos',
    location: '11 Church Road',
    city: 'Lagos',
    state: 'Lagos State',
    country: 'Nigeria',
    totalSpent: '₦154.52',
    totalSpentValue: 15452,
    lastOrder: '₦14.95',
    lastOrderId: 'ord-022',
    lastOrderDate: '2023-10-01T15:20:45Z',
    status: 'Active',
    orderCount: 12,
    averageOrderValue: 1288,
    loyaltyPoints: 230,
    preferredPaymentMethod: 'Card',
    preferredDeliveryTime: 'Evening',
    tags: ['regular', 'high-value'],
    notes: 'Prefers spicy food, allergic to seafood',
    favoriteItems: ['food-001', 'food-007'],
    deviceType: 'Android',
    appVersion: '2.3.0',
    birthDate: '1988-05-15',
    profileImage: '/images/customer-placeholder.jpg'
  },
  {
    id: 'cust-002',
    customerNumber: '#555222',
    registrationDate: '2020-03-27T14:22:18Z',
    date: '27 March 2020',
    name: 'Sarah Johnson',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@gmail.com',
    phone: '(+234) 802-345-6789',
    address: '21 King Street, Ikeja, Lagos',
    location: '21 King Street Lagos',
    city: 'Lagos',
    state: 'Lagos State',
    country: 'Nigeria',
    totalSpent: '₦74.92',
    totalSpentValue: 7492,
    lastOrder: '₦9.89',
    lastOrderId: 'ord-015',
    lastOrderDate: '2023-09-25T12:35:10Z',
    status: 'Active',
    orderCount: 8,
    averageOrderValue: 936,
    loyaltyPoints: 120,
    preferredPaymentMethod: 'Online Payment',
    preferredDeliveryTime: 'Afternoon',
    tags: ['new-app-user'],
    notes: 'Prefers contactless delivery',
    favoriteItems: ['food-003', 'food-012'],
    deviceType: 'iOS',
    appVersion: '2.3.1',
    birthDate: '1992-11-08',
    profileImage: '/images/customer-placeholder.jpg'
  },
  {
    id: 'cust-003',
    customerNumber: '#555223',
    registrationDate: '2020-03-28T09:10:45Z',
    date: '28 March 2020',
    name: 'Parky Shearing',
    firstName: 'Parky',
    lastName: 'Shearing',
    email: 'parky.shearing@gmail.com',
    phone: '(+234) 805-678-9012',
    address: '32 The Green, Victoria Island, Lagos',
    location: '32 The Green London',
    city: 'Lagos',
    state: 'Lagos State',
    country: 'Nigeria',
    totalSpent: '₦251.16',
    totalSpentValue: 25116,
    lastOrder: '₦23.99',
    lastOrderId: 'ord-031',
    lastOrderDate: '2023-08-15T18:22:33Z',
    status: 'Inactive',
    orderCount: 18,
    averageOrderValue: 1395,
    loyaltyPoints: 350,
    preferredPaymentMethod: 'Card',
    preferredDeliveryTime: 'Evening',
    tags: ['lapsed', 'high-value'],
    notes: 'Has not ordered in last 60 days',
    favoriteItems: ['food-006', 'food-010'],
    deviceType: 'Android',
    appVersion: '2.2.0',
    birthDate: '1985-03-22',
    profileImage: '/images/customer-placeholder.jpg'
  },
  {
    id: 'cust-004',
    customerNumber: '#555245',
    registrationDate: '2020-03-21T11:05:22Z',
    date: '21 March 2020',
    name: 'James Wilcocky',
    firstName: 'James',
    lastName: 'Wilcocky',
    email: 'james.wilcocky@gmail.com',
    phone: '(+234) 809-012-3456',
    address: '32 The Green, Surulere, Lagos',
    location: '32 The Green London',
    city: 'Lagos',
    state: 'Lagos State',
    country: 'Nigeria',
    totalSpent: '₦82.45',
    totalSpentValue: 8245,
    lastOrder: '₦42.25',
    lastOrderId: 'ord-044',
    lastOrderDate: '2023-10-02T19:15:50Z',
    status: 'Active',
    orderCount: 6,
    averageOrderValue: 1374,
    loyaltyPoints: 90,
    preferredPaymentMethod: 'Cash on Delivery',
    preferredDeliveryTime: 'Evening',
    tags: ['regular'],
    notes: 'Likes to order desserts',
    favoriteItems: ['food-005', 'food-011'],
    deviceType: 'iOS',
    appVersion: '2.3.0',
    birthDate: '1990-12-05',
    profileImage: '/images/customer-placeholder.jpg'
  },
  {
    id: 'cust-005',
    customerNumber: '#555256',
    registrationDate: '2020-03-12T16:33:40Z',
    date: '12 March 2020',
    name: 'Jessica Wong',
    firstName: 'Jessica',
    lastName: 'Wong',
    email: 'jessica.wong@gmail.com',
    phone: '(+234) 806-789-0123',
    address: '45 Banana Island Road, Ikoyi, Lagos',
    location: 'Tokyo',
    city: 'Lagos',
    state: 'Lagos State',
    country: 'Nigeria',
    totalSpent: '₦24.17',
    totalSpentValue: 2417,
    lastOrder: '₦5.16',
    lastOrderId: 'ord-018',
    lastOrderDate: '2023-09-20T13:10:25Z',
    status: 'Active',
    orderCount: 4,
    averageOrderValue: 604,
    loyaltyPoints: 40,
    preferredPaymentMethod: 'Card',
    preferredDeliveryTime: 'Morning',
    tags: ['breakfast-lover'],
    notes: 'Usually orders breakfast items',
    favoriteItems: ['food-004', 'food-008'],
    deviceType: 'Android',
    appVersion: '2.3.1',
    birthDate: '1995-07-12',
    profileImage: '/images/customer-placeholder.jpg'
  },
  {
    id: 'cust-006',
    customerNumber: '#555258',
    registrationDate: '2020-03-15T10:22:15Z',
    date: '15 March 2020',
    name: 'Olivia Shaw',
    firstName: 'Olivia',
    lastName: 'Shaw',
    email: 'olivia.shaw@gmail.com',
    phone: '(+234) 801-234-5678',
    address: '28 Queens Drive, Ikoyi, Lagos',
    location: 'New York',
    city: 'Lagos',
    state: 'Lagos State',
    country: 'Nigeria',
    totalSpent: '₦24.55',
    totalSpentValue: 2455,
    lastOrder: '₦7.27',
    lastOrderId: 'ord-050',
    lastOrderDate: '2023-10-05T11:45:30Z',
    status: 'New',
    orderCount: 2,
    averageOrderValue: 1228,
    loyaltyPoints: 20,
    preferredPaymentMethod: 'Online Payment',
    preferredDeliveryTime: 'Afternoon',
    tags: ['new-user', 'vegetarian'],
    notes: 'Vegetarian diet preferences',
    favoriteItems: ['food-009'],
    deviceType: 'iOS',
    appVersion: '2.3.0',
    birthDate: '1993-09-18',
    profileImage: '/images/customer-placeholder.jpg'
  },
  {
    id: 'cust-007',
    customerNumber: '#555275',
    registrationDate: '2020-03-17T14:05:50Z',
    date: '17 March 2020',
    name: 'Randy Greenlee',
    firstName: 'Randy',
    lastName: 'Greenlee',
    email: 'randy.greenlee@gmail.com',
    phone: '(+234) 808-901-2345',
    address: '17 Church Street, Yaba, Lagos',
    location: 'San Francisco',
    city: 'Lagos',
    state: 'Lagos State',
    country: 'Nigeria',
    totalSpent: '₦43.95',
    totalSpentValue: 4395,
    lastOrder: '₦5.41',
    lastOrderId: 'ord-027',
    lastOrderDate: '2023-09-18T20:05:15Z',
    status: 'Active',
    orderCount: 7,
    averageOrderValue: 628,
    loyaltyPoints: 70,
    preferredPaymentMethod: 'Card',
    preferredDeliveryTime: 'Evening',
    tags: ['regular', 'night-orders'],
    notes: 'Usually orders late in the evening',
    favoriteItems: ['food-002', 'food-007'],
    deviceType: 'Android',
    appVersion: '2.2.1',
    birthDate: '1987-01-30',
    profileImage: '/images/customer-placeholder.jpg'
  },
  {
    id: 'cust-008',
    customerNumber: '#555288',
    registrationDate: '2020-03-18T09:15:30Z',
    date: '18 March 2020',
    name: 'Randy Smith',
    firstName: 'Randy',
    lastName: 'Smith',
    email: 'randy.smith@gmail.com',
    phone: '(+234) 807-890-1234',
    address: '56 Marina Street, Lagos Island, Lagos',
    location: 'Tokyo',
    city: 'Lagos',
    state: 'Lagos State',
    country: 'Nigeria',
    totalSpent: '₦22.18',
    totalSpentValue: 2218,
    lastOrder: '₦8.88',
    lastOrderId: 'ord-035',
    lastOrderDate: '2023-07-20T12:30:45Z',
    status: 'Inactive',
    orderCount: 3,
    averageOrderValue: 739,
    loyaltyPoints: 30,
    preferredPaymentMethod: 'Cash on Delivery',
    preferredDeliveryTime: 'Afternoon',
    tags: ['lapsed'],
    notes: 'Has not ordered in over 90 days',
    favoriteItems: ['food-005'],
    deviceType: 'iOS',
    appVersion: '2.2.0',
    birthDate: '1983-04-12',
    profileImage: '/images/customer-placeholder.jpg'
  },
  {
    id: 'cust-009',
    customerNumber: '#555257',
    registrationDate: '2020-03-11T17:20:05Z',
    date: '11 March 2020',
    name: 'Michael Richards',
    firstName: 'Michael',
    lastName: 'Richards',
    email: 'michael.richards@gmail.com',
    phone: '(+234) 803-789-0123',
    address: '544 Manor Road, Ikeja, Lagos',
    location: 'San Francisco',
    city: 'Lagos',
    state: 'Lagos State',
    country: 'Nigeria',
    totalSpent: '₦43.95',
    totalSpentValue: 4395,
    lastOrder: '₦6.41',
    lastOrderId: 'ord-040',
    lastOrderDate: '2023-09-30T18:10:33Z',
    status: 'Active',
    orderCount: 5,
    averageOrderValue: 879,
    loyaltyPoints: 50,
    preferredPaymentMethod: 'Card',
    preferredDeliveryTime: 'Evening',
    tags: ['regular'],
    notes: 'Prefers local cuisine',
    favoriteItems: ['food-001', 'food-002'],
    deviceType: 'Android',
    appVersion: '2.3.0',
    birthDate: '1989-08-25',
    profileImage: '/images/customer-placeholder.jpg'
  },
  {
    id: 'cust-010',
    customerNumber: '#555297',
    registrationDate: '2020-03-10T10:30:15Z',
    date: '10 March 2020',
    name: 'Emma Baker',
    firstName: 'Emma',
    lastName: 'Baker',
    email: 'emma.baker@gmail.com',
    phone: '(+234) 805-123-4567',
    address: '35 Station Road, Lekki Phase 2, Lagos',
    location: 'Edinburgh',
    city: 'Lagos',
    state: 'Lagos State',
    country: 'Nigeria',
    totalSpent: '₦44.99',
    totalSpentValue: 4499,
    lastOrder: '₦19.88',
    lastOrderId: 'ord-048',
    lastOrderDate: '2023-10-03T13:22:10Z',
    status: 'New',
    orderCount: 2,
    averageOrderValue: 2250,
    loyaltyPoints: 20,
    preferredPaymentMethod: 'Online Payment',
    preferredDeliveryTime: 'Afternoon',
    tags: ['new-user', 'high-order-value'],
    notes: 'First ordered through promo campaign',
    favoriteItems: ['food-003'],
    deviceType: 'iOS',
    appVersion: '2.3.1',
    birthDate: '1991-12-10',
    profileImage: '/images/customer-placeholder.jpg'
  }
];

// Customer status definitions for reference
const CUSTOMER_STATUSES = [
  { id: 'active', name: 'Active', color: 'bg-green-100 text-green-800 border-green-200' },
  { id: 'inactive', name: 'Inactive', color: 'bg-gray-100 text-gray-800 border-gray-200' },
  { id: 'new', name: 'New', color: 'bg-blue-100 text-blue-800 border-blue-200' }
];

// Tags for filtering
const CUSTOMER_TAGS = [
  { id: 'regular', name: 'Regular Customer' },
  { id: 'high-value', name: 'High Value' },
  { id: 'lapsed', name: 'Lapsed Customer' },
  { id: 'new-user', name: 'New User' },
  { id: 'vegetarian', name: 'Vegetarian' },
  { id: 'night-orders', name: 'Night Orders' },
  { id: 'breakfast-lover', name: 'Breakfast Lover' }
];

// Stat Card Component
const StatCard = ({ icon, title, value, color, bgColor }) => {
  return (
    <div className={`${bgColor} p-6 rounded-lg shadow-sm flex items-center`}>
      <div className={`${color} p-3 rounded-full mr-4`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  let badgeClass = '';
  
  switch(status.toLowerCase()) {
    case 'active':
      badgeClass = 'bg-green-100 text-green-800 border-green-200';
      break;
    case 'inactive':
      badgeClass = 'bg-gray-100 text-gray-800 border-gray-200';
      break;
    case 'new':
      badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
      break;
    default:
      badgeClass = 'bg-gray-100 text-gray-800 border-gray-200';
  }
  
  return (
    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${badgeClass}`}>
      {status}
    </span>
  );
};

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    // Simulate API fetch
    const fetchCustomers = () => {
      setTimeout(() => {
        setCustomers(MOCK_CUSTOMERS);
        setLoading(false);
      }, 800);
    };

    fetchCustomers();
  }, []);
  
  // Handle select all checkbox
  useEffect(() => {
    if (selectAll) {
      setSelectedRows(currentItems.map(customer => customer.id));
    } else {
      setSelectedRows([]);
    }
  }, [selectAll]);

  // Calculate stats
  const totalCustomers = customers.length;
  const newCustomers = customers.filter(c => c.status.toLowerCase() === 'new').length;
  const activeCustomers = customers.filter(c => c.status.toLowerCase() === 'active').length;
  
  // Calculate total revenue
  const totalRevenue = customers.reduce((sum, customer) => {
    // Using the totalSpentValue property for more accurate calculations
    return sum + (customer.totalSpentValue / 100); // Convert back to currency unit
  }, 0).toFixed(2);

  // Filter customers based on search term and status filter
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !searchTerm || 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = selectedFilter === 'All' || 
      customer.status === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  
  // Toggle row selection
  const toggleRowSelection = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  // Handle bulk actions
  const handleBulkAction = (action) => {
    if (selectedRows.length === 0) return;
    
    // In a real app, you would make API calls here
    alert(`${action} ${selectedRows.length} selected customers`);
  };

  return (
    <DashboardLayout>
      <SEO 
        title="Customer List" 
        description="View and manage all customers" 
      />
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customer List</h1>
              <p className="text-gray-500 mt-1">Manage your customers and their information</p>
            </div>
            
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              <FiUserPlus className="mr-2" />
              Add New Customer
            </button>
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard 
              icon={<FiUsers className="h-6 w-6 text-white" />}
              title="Total Customers"
              value={totalCustomers}
              color="bg-blue-500"
              bgColor="bg-white"
            />
            <StatCard 
              icon={<FiUserPlus className="h-6 w-6 text-white" />}
              title="New Customers"
              value={newCustomers}
              color="bg-green-500"
              bgColor="bg-white"
            />
            <StatCard 
              icon={<FiShoppingBag className="h-6 w-6 text-white" />}
              title="Active Customers"
              value={activeCustomers}
              color="bg-purple-500"
              bgColor="bg-white"
            />
            <StatCard 
              icon={<FiDollarSign className="h-6 w-6 text-white" />}
              title="Total Revenue"
              value={`₦${totalRevenue}`}
              color="bg-amber-500"
              bgColor="bg-white"
            />
          </div>
          
          {/* Filters and Actions Row */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              {/* Left side controls */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                {/* Status filter */}
                <div className="flex items-center">
                  <label className="text-sm text-gray-500 mr-2">Status:</label>
                  <select 
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="New">New</option>
                  </select>
                </div>
                
                {/* Bulk actions */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleBulkAction('Export')}
                    disabled={selectedRows.length === 0}
                    className={`text-sm px-3 py-2 inline-flex items-center rounded ${
                      selectedRows.length > 0 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <FiDownload className="mr-1" />
                    Export Selected
                  </button>
                  <button 
                    onClick={() => handleBulkAction('Delete')}
                    disabled={selectedRows.length === 0}
                    className={`text-sm px-3 py-2 inline-flex items-center rounded ${
                      selectedRows.length > 0 
                        ? 'bg-red-50 text-red-700 hover:bg-red-100' 
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Delete Selected
                  </button>
                </div>
              </div>
              
              {/* Right side controls */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button className="inline-flex items-center text-sm px-3 py-2 bg-gray-100 rounded hover:bg-gray-200">
                  <FiRefreshCw className="mr-1" />
                  Refresh
                </button>
                
                {/* Search */}
                <div className="relative flex-grow md:flex-grow-0">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FiSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full md:w-60 pl-10 p-2.5"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Customer Table */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={selectAll}
                          onChange={() => setSelectAll(!selectAll)}
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Order
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.map((customer, index) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked={selectedRows.includes(customer.id)}
                            onChange={() => toggleRowSelection(customer.id)}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {customer.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {customer.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={customer.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {customer.totalSpent}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {customer.lastOrder}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative">
                          <button 
                            className="text-gray-500 hover:text-gray-700"
                            onClick={() => setShowActionMenu(showActionMenu === customer.id ? null : customer.id)}
                          >
                            <FiMoreVertical />
                          </button>
                          
                          {showActionMenu === customer.id && (
                            <div className="absolute right-0 z-10 mt-2 bg-white rounded-md shadow-lg w-48 py-1 ring-1 ring-black ring-opacity-5">
                              <button 
                                className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  alert(`View details for ${customer.name}`);
                                  setShowActionMenu(null);
                                }}
                              >
                                View Details
                              </button>
                              <button 
                                className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  alert(`Edit ${customer.name}`);
                                  setShowActionMenu(null);
                                }}
                              >
                                Edit Customer
                              </button>
                              <button 
                                className="block w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100"
                                onClick={() => {
                                  alert(`Delete ${customer.name}`);
                                  setShowActionMenu(null);
                                }}
                              >
                                Delete Customer
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="text-sm text-gray-700 mb-4 sm:mb-0">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCustomers.length)} of {filteredCustomers.length} entries
              </div>
              <div className="flex items-center">
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button 
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    disabled={currentPage === 1}
                  >
                    <span className="sr-only">Previous</span>
                    <FiChevronLeft className="h-5 w-5" />
                  </button>
                  
                  {Array.from({ length: Math.min(totalPages, 3) }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePageChange(idx + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                        currentPage === idx + 1
                          ? 'bg-blue-50 text-blue-600 border-blue-500 z-10'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    disabled={currentPage === totalPages}
                  >
                    <span className="sr-only">Next</span>
                    <FiChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
} 