import { useState, useEffect } from 'react';
import { FiDownload, FiPrinter, FiEdit, FiPlus, FiFilter, FiChevronLeft, FiChevronRight, FiTrash2 } from 'react-icons/fi';
import SEO from '../shared/components/SEO';
import DashboardLayout from '../shared/components/DashboardLayout';
import InventoryItemForm from '../shared/components/InventoryItemForm';

// Mock inventory data
const MOCK_INVENTORY_ITEMS = [
  {
    id: "inv-001",
    name: 'Cabbage',
    category: 'Vegetables',
    categoryId: 'cat-veg',
    supplierId: 'sup-001',
    supplierName: 'Cocobanana Nigeria Ltd',
    requestedDeliveryDate: '02/25/2023',
    actualDeliveryDate: '02/25/2023',
    requestedQuantity: 25,
    unit: 'kg',
    actualQuantity: 23,
    price: 225, // in Naira
    total: 5175, // in Naira
    status: 'In Stock',
    stockLevel: 80, // percentage
    expiryDate: '03/25/2023',
    location: 'Shelf A2',
    nutritionalInfo: {
      calories: 25,
      carbs: '5.8g',
      protein: '1.3g',
      fat: '0.1g'
    },
    lastUpdated: '2023-02-25T10:15:30Z',
    tags: ['fresh', 'vegetable', 'green']
  },
  {
    id: "inv-002",
    name: 'Onion',
    category: 'Vegetables',
    categoryId: 'cat-veg',
    supplierId: 'sup-001',
    supplierName: 'Cocobanana Nigeria Ltd',
    requestedDeliveryDate: '02/20/2023',
    actualDeliveryDate: '02/20/2023',
    requestedQuantity: 12,
    unit: 'kg',
    actualQuantity: 10,
    price: 100, // in Naira
    total: 1000, // in Naira
    status: 'Low Stock',
    stockLevel: 25, // percentage
    expiryDate: '03/15/2023',
    location: 'Shelf A3',
    nutritionalInfo: {
      calories: 40,
      carbs: '9.3g',
      protein: '1.1g',
      fat: '0.1g'
    },
    lastUpdated: '2023-02-20T09:30:45Z',
    tags: ['vegetable', 'spice']
  },
  {
    id: "inv-003",
    name: 'Fish',
    category: 'Seafood',
    categoryId: 'cat-sea',
    supplierId: 'sup-002',
    supplierName: 'Lagos Fish Market Ltd',
    requestedDeliveryDate: '02/16/2023',
    actualDeliveryDate: '02/16/2023',
    requestedQuantity: 5,
    unit: 'pcs',
    actualQuantity: 3,
    price: 1315, // in Naira
    total: 3945, // in Naira
    status: 'In Stock',
    stockLevel: 60, // percentage
    expiryDate: '02/23/2023',
    location: 'Freezer B1',
    nutritionalInfo: {
      calories: 205,
      carbs: '0g',
      protein: '22g',
      fat: '12g'
    },
    lastUpdated: '2023-02-16T14:20:10Z',
    tags: ['seafood', 'protein', 'frozen']
  },
  {
    id: "inv-004",
    name: 'Pork',
    category: 'Meat',
    categoryId: 'cat-meat',
    supplierId: 'sup-003',
    supplierName: 'Ikeja Butchers Inc',
    requestedDeliveryDate: '02/16/2023',
    actualDeliveryDate: '02/16/2023',
    requestedQuantity: 25,
    unit: 'kg',
    actualQuantity: 23,
    price: 1500, // in Naira
    total: 34500, // in Naira
    status: 'In Stock',
    stockLevel: 75, // percentage
    expiryDate: '02/26/2023',
    location: 'Freezer B2',
    nutritionalInfo: {
      calories: 242,
      carbs: '0g',
      protein: '26g',
      fat: '14g'
    },
    lastUpdated: '2023-02-16T15:45:20Z',
    tags: ['meat', 'protein', 'frozen']
  },
  {
    id: "inv-005",
    name: 'Milk',
    category: 'Dairy',
    categoryId: 'cat-dairy',
    supplierId: 'sup-004',
    supplierName: 'Peak Dairy Products',
    requestedDeliveryDate: '02/16/2023',
    actualDeliveryDate: '02/16/2023',
    requestedQuantity: 8,
    unit: 'L',
    actualQuantity: 6,
    price: 800, // in Naira
    total: 4800, // in Naira
    status: 'Low Stock',
    stockLevel: 30, // percentage
    expiryDate: '03/02/2023',
    location: 'Refrigerator C1',
    nutritionalInfo: {
      calories: 122,
      carbs: '12g',
      protein: '8g',
      fat: '4.8g'
    },
    lastUpdated: '2023-02-16T11:10:35Z',
    tags: ['dairy', 'refrigerated']
  },
  {
    id: "inv-006",
    name: 'Rice',
    category: 'Grains',
    categoryId: 'cat-grain',
    supplierId: 'sup-005',
    supplierName: 'Nigerian Harvest Ltd',
    requestedDeliveryDate: '02/14/2023',
    actualDeliveryDate: '02/15/2023',
    requestedQuantity: 50,
    unit: 'kg',
    actualQuantity: 50,
    price: 250, // in Naira
    total: 12500, // in Naira
    status: 'In Stock',
    stockLevel: 85, // percentage
    expiryDate: '08/15/2023',
    location: 'Storeroom D2',
    nutritionalInfo: {
      calories: 130,
      carbs: '28g',
      protein: '2.7g',
      fat: '0.3g'
    },
    lastUpdated: '2023-02-15T16:30:45Z',
    tags: ['grain', 'staple']
  },
  {
    id: "inv-007",
    name: 'Tomatoes',
    category: 'Vegetables',
    categoryId: 'cat-veg',
    supplierId: 'sup-001',
    supplierName: 'Cocobanana Nigeria Ltd',
    requestedDeliveryDate: '02/12/2023',
    actualDeliveryDate: '02/12/2023',
    requestedQuantity: 15,
    unit: 'kg',
    actualQuantity: 15,
    price: 325, // in Naira
    total: 4875, // in Naira
    status: 'In Stock',
    stockLevel: 70, // percentage
    expiryDate: '02/22/2023',
    location: 'Shelf A1',
    nutritionalInfo: {
      calories: 18,
      carbs: '3.9g',
      protein: '0.9g',
      fat: '0.2g'
    },
    lastUpdated: '2023-02-12T08:45:15Z',
    tags: ['fresh', 'vegetable', 'red']
  }
];

// Categories reference data
export const INVENTORY_CATEGORIES = [
  { id: 'cat-veg', name: 'Vegetables', iconUrl: '/icons/vegetable.png' },
  { id: 'cat-meat', name: 'Meat', iconUrl: '/icons/meat.png' },
  { id: 'cat-sea', name: 'Seafood', iconUrl: '/icons/seafood.png' },
  { id: 'cat-dairy', name: 'Dairy', iconUrl: '/icons/dairy.png' },
  { id: 'cat-grain', name: 'Grains', iconUrl: '/icons/grain.png' },
  { id: 'cat-spice', name: 'Spices', iconUrl: '/icons/spice.png' }
];

// Suppliers reference data
export const SUPPLIERS = [
  { 
    id: 'sup-001', 
    name: 'Cocobanana Nigeria Ltd', 
    address: '35 Akin Adesola Street, Victoria Island, Lagos 101233',
    phone: '(+234) 812-345-6789',
    email: 'cocobanana@gmail.com',
    categories: ['cat-veg', 'cat-spice'],
    rating: 4.7
  },
  { 
    id: 'sup-002', 
    name: 'Lagos Fish Market Ltd', 
    address: '12 Marina Road, Lagos Island, Lagos',
    phone: '(+234) 809-123-4567',
    email: 'lagosfishmarket@gmail.com',
    categories: ['cat-sea'],
    rating: 4.5
  },
  { 
    id: 'sup-003', 
    name: 'Ikeja Butchers Inc', 
    address: '45 Allen Avenue, Ikeja, Lagos',
    phone: '(+234) 805-987-6543',
    email: 'ikejabutchers@gmail.com',
    categories: ['cat-meat'],
    rating: 4.6
  },
  { 
    id: 'sup-004', 
    name: 'Peak Dairy Products', 
    address: '78 Awolowo Road, Ikoyi, Lagos',
    phone: '(+234) 802-345-6789',
    email: 'peakdairy@gmail.com',
    categories: ['cat-dairy'],
    rating: 4.8
  },
  { 
    id: 'sup-005', 
    name: 'Nigerian Harvest Ltd', 
    address: '23 Oba Akran Avenue, Ikeja, Lagos',
    phone: '(+234) 803-789-1234',
    email: 'nigerianharvest@gmail.com',
    categories: ['cat-grain'],
    rating: 4.4
  }
];

// Status Badge Component
const StatusBadge = ({ status }) => {
  let badgeClass = '';
  
  switch(status.toLowerCase()) {
    case 'in stock':
      badgeClass = 'bg-green-100 text-green-800 border-green-200';
      break;
    case 'low stock':
      badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
      break;
    case 'out of stock':
      badgeClass = 'bg-red-100 text-red-800 border-red-200';
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

// Order Details Component
const OrderDetails = () => {
  return (
    <div className="bg-orange-100 p-4 rounded-t-lg">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-sm text-orange-800">Number:</div>
          <div className="font-bold">45678-032</div>
        </div>
        <div>
          <div className="text-sm text-orange-800">Date:</div>
          <div className="font-bold">02/10/2023</div>
        </div>
        <div>
          <div className="text-sm text-orange-800">Status:</div>
          <div className="font-bold">Processing</div>
        </div>
      </div>
    </div>
  );
};

// Vendor Information Component
const VendorInformation = () => {
  return (
    <div className="grid grid-cols-2 gap-6 mb-6 p-4 bg-white rounded-b-lg shadow-sm">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Vendor:</h3>
        <div className="text-sm text-gray-600">
          <p className="font-medium">Cocobanana Nigeria Ltd</p>
          <p>35 Akin Adesola Street</p>
          <p>Victoria Island, Lagos 101233</p>
          <p className="mt-2">Phone: (+234) 812-345-6789</p>
          <p>E-mail: cocobanana@gmail.com</p>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Restaurant Address:</h3>
        <div className="text-sm text-gray-600">
          <p>42 Adeola Odeku Street</p>
          <p>Ikeja, Lagos 100271</p>
        </div>
      </div>
    </div>
  );
};

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [showModal, setShowModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    // Simulate API fetch
    const fetchInventory = () => {
      setTimeout(() => {
        setInventory(MOCK_INVENTORY_ITEMS);
        setLoading(false);
      }, 800);
    };

    fetchInventory();
  }, []);

  // Get unique categories
  const categories = ['All', ...new Set(inventory.map(item => item.category))];

  // Filter inventory based on selected category
  const filteredInventory = selectedCategory === 'All' 
    ? inventory 
    : inventory.filter(item => item.category === selectedCategory);

  // Calculate totals
  const totalAmount = filteredInventory.reduce((sum, item) => sum + item.total, 0).toFixed(2);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInventory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Open modal to add new item
  const handleAddItem = () => {
    setCurrentItem(null);
    setShowModal(true);
  };

  // Open modal to edit existing item
  const handleEditItem = (item) => {
    setCurrentItem(item);
    setShowModal(true);
  };

  // Handle form submission (add/edit)
  const handleFormSubmit = (formData) => {
    if (currentItem) {
      // Update existing item
      setInventory(prev => 
        prev.map(item => 
          item.id === currentItem.id ? { ...formData, id: currentItem.id } : item
        )
      );
    } else {
      // Add new item with generated ID
      const newId = `inv-${String(inventory.length + 1).padStart(3, '0')}`;
      setInventory(prev => [...prev, { ...formData, id: newId }]);
    }
    
    setShowModal(false);
  };

  // Confirm delete prompt
  const handleDeleteConfirm = (item) => {
    setConfirmDelete(item);
  };

  // Delete item
  const handleDeleteItem = () => {
    if (confirmDelete) {
      setInventory(prev => prev.filter(item => item.id !== confirmDelete.id));
      setConfirmDelete(null);
    }
  };

  // Cancel delete
  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };

  return (
    <DashboardLayout>
      <SEO 
        title="Inventory" 
        description="Manage your restaurant's inventory" 
      />
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-gray-500 mt-1">Manage your food items and supplies</p>
            </div>
            
            <div className="flex gap-2">
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <FiPrinter className="mr-2 h-4 w-4" />
                Print
              </button>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <FiDownload className="mr-2 h-4 w-4" />
                Export
              </button>
              <button 
                onClick={handleAddItem}
                className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <FiPlus className="mr-2 h-4 w-4" />
                Add Item
              </button>
            </div>
          </div>
          
          {/* Order and Vendor Information */}
          <OrderDetails />
          <VendorInformation />
          
          {/* Category Filter */}
          <div className="flex items-center mb-4 overflow-x-auto pb-2">
            <div className="text-sm text-gray-500 mr-2">Filter by:</div>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 text-sm rounded-full mr-2 ${
                  selectedCategory === category
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          
          {/* Inventory Table */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested Delivery Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actual Delivery Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actual Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.requestedDeliveryDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.actualDeliveryDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.requestedQuantity} <span className="text-xs text-gray-400">{item.unit}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.actualQuantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₦{item.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₦{item.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleEditItem(item)} 
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          title="Edit Item"
                        >
                          <FiEdit />
                        </button>
                        <button 
                          onClick={() => handleDeleteConfirm(item)} 
                          className="text-red-500 hover:text-red-700"
                          title="Delete Item"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-500">
                      TOTAL:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      ₦{totalAmount}
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredInventory.length)} of {filteredInventory.length} entries
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
          
          {/* Add/Edit Item Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto">
                <div className="p-6 border-b">
                  <h3 className="text-xl font-medium text-gray-900">
                    {currentItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
                  </h3>
                </div>
                <div className="p-6">
                  <InventoryItemForm 
                    item={currentItem}
                    onSubmit={handleFormSubmit}
                    onCancel={() => setShowModal(false)}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Delete Confirmation Modal */}
          {confirmDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete <span className="font-semibold">{confirmDelete.name}</span>? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCancelDelete}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteItem}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
} 