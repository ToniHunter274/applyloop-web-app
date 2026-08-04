import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  FiCheckCircle, 
  FiXCircle, 
  FiSearch, 
  FiRefreshCw, 
  FiFilter, 
  FiInfo, 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiClock,
  FiShield
} from 'react-icons/fi';
import SEO from '../../shared/components/SEO';
import useAdmin from '../../shared/hooks/useAdmin';

const VendorApprovalsPage = () => {
  const router = useRouter();
  const { approveVendor, rejectVendor, getVendors, loading } = useAdmin();
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check authentication
  useEffect(() => {
    try {
      console.log('Checking admin authentication in vendor-approvals page...');
      const adminToken = localStorage.getItem('orderlyAdminToken');
      const adminDataStr = localStorage.getItem('orderlyAdminData');
      
      console.log('Admin token:', adminToken ? 'exists' : 'not found');
      console.log('Admin data:', adminDataStr ? 'exists' : 'not found');
      
      if (!adminToken || !adminDataStr) {
        console.log('Admin authentication failed. Redirecting to login...');
        router.push('/admin/login');
        return;
      }
      
      // Check if admin data is valid
      try {
        const adminData = JSON.parse(adminDataStr);
        if (!adminData || adminData.role !== 'admin') {
          console.log('Invalid admin role. Redirecting to login...');
          router.push('/admin/login');
          return;
        }
        
        // Admin is authenticated
        console.log('Admin authenticated successfully in vendor-approvals');
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Error parsing admin data:', e);
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Authentication check error:', error);
      router.push('/admin/login');
    }
  }, [router]);
  
  // Fetch vendors on component mount
  useEffect(() => {
    if (isAuthenticated) {
      const loadVendors = async () => {
        setIsLoading(true);
        try {
          const vendorList = await getVendors();
          setVendors(vendorList);
          filterVendors(vendorList, searchTerm, statusFilter);
        } catch (error) {
          console.error('Failed to load vendors:', error);
          showNotification('Error loading vendors', 'error');
        } finally {
          setIsLoading(false);
        }
      };
      
      loadVendors();
    }
  }, [getVendors, isAuthenticated, statusFilter, searchTerm]);
  
  // Filter vendors based on search term and status filter
  const filterVendors = (vendorList, search, status) => {
    const filtered = vendorList.filter(vendor => {
      const matchesSearch = 
        !search || 
        vendor.name?.toLowerCase().includes(search.toLowerCase()) ||
        vendor.email?.toLowerCase().includes(search.toLowerCase()) ||
        vendor.phone?.toLowerCase().includes(search.toLowerCase()) ||
        vendor.address?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = status === 'All' || vendor.verificationStatus === status;
      
      return matchesSearch && matchesStatus;
    });
    
    setFilteredVendors(filtered);
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    filterVendors(vendors, value, statusFilter);
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    filterVendors(vendors, searchTerm, status);
  };
  
  // Handle vendor selection for details view
  const handleSelectVendor = (vendor) => {
    setSelectedVendor(vendor);
  };
  
  // Handle vendor approval
  const handleApproveVendor = async (vendorId) => {
    try {
      setIsLoading(true);
      const result = await approveVendor(vendorId);
      
      if (result.success) {
        // Update the local vendors list
        const updatedVendors = vendors.map(vendor => 
          vendor.id === vendorId 
            ? { ...vendor, verificationStatus: 'Approved' }
            : vendor
        );
        
        setVendors(updatedVendors);
        filterVendors(updatedVendors, searchTerm, statusFilter);
        
        // Reset selected vendor
        if (selectedVendor && selectedVendor.id === vendorId) {
          setSelectedVendor({ ...selectedVendor, verificationStatus: 'Approved' });
        }
        
        showNotification('Vendor approved successfully', 'success');
      } else {
        showNotification(result.error || 'Failed to approve vendor', 'error');
      }
    } catch (error) {
      console.error('Error approving vendor:', error);
      showNotification('An error occurred while approving vendor', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle vendor rejection
  const handleRejectVendor = async (vendorId) => {
    if (!rejectionReason.trim()) {
      showNotification('Please provide a reason for rejection', 'warning');
      return;
    }
    
    try {
      setIsLoading(true);
      const result = await rejectVendor(vendorId, rejectionReason);
      
      if (result.success) {
        // Update the local vendors list
        const updatedVendors = vendors.map(vendor => 
          vendor.id === vendorId 
            ? { ...vendor, verificationStatus: 'Rejected', rejectionReason }
            : vendor
        );
        
        setVendors(updatedVendors);
        filterVendors(updatedVendors, searchTerm, statusFilter);
        
        // Reset selected vendor
        if (selectedVendor && selectedVendor.id === vendorId) {
          setSelectedVendor({ 
            ...selectedVendor, 
            verificationStatus: 'Rejected',
            rejectionReason 
          });
        }
        
        // Reset rejection reason
        setRejectionReason('');
        
        showNotification('Vendor rejected successfully', 'success');
      } else {
        showNotification(result.error || 'Failed to reject vendor', 'error');
      }
    } catch (error) {
      console.error('Error rejecting vendor:', error);
      showNotification('An error occurred while rejecting vendor', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };
  
  // Refresh vendors list
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const vendorList = await getVendors();
      setVendors(vendorList);
      filterVendors(vendorList, searchTerm, statusFilter);
      showNotification('Vendor list refreshed', 'info');
    } catch (error) {
      console.error('Failed to refresh vendors:', error);
      showNotification('Error refreshing vendors', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <FiCheckCircle className="mr-1" /> Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <FiXCircle className="mr-1" /> Rejected
          </span>
        );
      case 'Pending':
        return (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <FiClock className="mr-1" /> Pending
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <FiInfo className="mr-1" /> {status}
          </span>
        );
    }
  };
  
  if (!isAuthenticated) {
    return <div className="flex justify-center items-center h-screen">Redirecting to login...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <SEO
        title="Vendor Approvals"
        description="Manage and approve vendor registration requests"
      />
      
      {/* Admin Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FiShield className="h-8 w-8 text-blue-600 mr-2" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vendor Approvals</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage vendor registration requests</p>
              </div>
            </div>
            
            <div>
              <button
                onClick={() => router.push('/admin')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notification */}
        {notification && (
          <div 
            className={`p-4 mb-4 rounded-lg ${
              notification.type === 'error' ? 'bg-red-100 text-red-800' :
              notification.type === 'success' ? 'bg-green-100 text-green-800' :
              notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}
          >
            {notification.message}
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Vendors list panel */}
          <div className="lg:w-2/3 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Vendor List</h2>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleRefresh}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-full"
                  disabled={loading}
                >
                  <FiRefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            
            {/* Search and filters */}
            <div className="mb-6">
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FiSearch className="text-gray-500" />
                </div>
                <input
                  type="text"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    statusFilter === 'All' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => handleStatusFilterChange('All')}
                >
                  All
                </button>
                <button
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    statusFilter === 'Pending' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => handleStatusFilterChange('Pending')}
                >
                  Pending
                </button>
                <button
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    statusFilter === 'Approved' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => handleStatusFilterChange('Approved')}
                >
                  Approved
                </button>
                <button
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    statusFilter === 'Rejected' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => handleStatusFilterChange('Rejected')}
                >
                  Rejected
                </button>
              </div>
            </div>
            
            {/* Vendors list */}
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="text-center py-12">
                <FiInfo className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-2 text-lg text-gray-500">No vendors found</p>
                <p className="text-sm text-gray-400">Try changing your filters or search term</p>
              </div>
            ) : (
              <div className="overflow-auto max-h-[600px] custom-scrollbar">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-6 py-3">Vendor</th>
                      <th scope="col" className="px-6 py-3">Contact</th>
                      <th scope="col" className="px-6 py-3">Registered</th>
                      <th scope="col" className="px-6 py-3">Status</th>
                      <th scope="col" className="px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVendors.map((vendor) => (
                      <tr 
                        key={vendor.id} 
                        className={`bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                          selectedVendor?.id === vendor.id ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                        }`}
                        onClick={() => handleSelectVendor(vendor)}
                      >
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                          {vendor.name || 'Unknown Vendor'}
                        </td>
                        <td className="px-6 py-4">
                          {vendor.email || 'No email'}
                        </td>
                        <td className="px-6 py-4">
                          {new Date(vendor.registeredAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {renderStatusBadge(vendor.verificationStatus)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            {vendor.verificationStatus === 'Pending' && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApproveVendor(vendor.id);
                                  }}
                                  className="p-1 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  disabled={loading}
                                >
                                  <FiCheckCircle className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectVendor(vendor);
                                  }}
                                  className="p-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                  disabled={loading}
                                >
                                  <FiXCircle className="h-5 w-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Vendor details panel */}
          <div className="lg:w-1/3 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            {selectedVendor ? (
              <div>
                <h2 className="text-xl font-bold mb-4">Vendor Details</h2>
                
                <div className="mb-6">
                  {renderStatusBadge(selectedVendor.verificationStatus)}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <FiUser className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Vendor Name</p>
                      <p className="font-medium">{selectedVendor.name || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FiMail className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{selectedVendor.email || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FiPhone className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{selectedVendor.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  {selectedVendor.address && (
                    <div className="flex items-start">
                      <FiMapPin className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium">{selectedVendor.address}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start">
                    <FiClock className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Registered On</p>
                      <p className="font-medium">
                        {new Date(selectedVendor.registeredAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {selectedVendor.rejectionReason && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg">
                      <p className="text-sm font-medium text-red-800 dark:text-red-400">Rejection Reason</p>
                      <p className="text-sm text-red-700 dark:text-red-300">{selectedVendor.rejectionReason}</p>
                    </div>
                  )}
                </div>
                
                {selectedVendor.verificationStatus === 'Pending' && (
                  <div className="mt-6 space-y-4">
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h3 className="text-lg font-medium mb-2">Approve or Reject</h3>
                      
                      <div className="flex flex-col space-y-4">
                        <button
                          onClick={() => handleApproveVendor(selectedVendor.id)}
                          className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center disabled:opacity-50"
                          disabled={loading}
                        >
                          <FiCheckCircle className="mr-2" />
                          Approve Vendor
                        </button>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Rejection Reason (required for rejection)
                          </label>
                          <textarea
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm p-2.5"
                            rows="3"
                            placeholder="Enter reason for rejection..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                          ></textarea>
                          
                          <button
                            onClick={() => handleRejectVendor(selectedVendor.id)}
                            className="mt-2 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center disabled:opacity-50"
                            disabled={loading || !rejectionReason.trim()}
                          >
                            <FiXCircle className="mr-2" />
                            Reject Vendor
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <FiInfo className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  Select a vendor from the list to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default VendorApprovalsPage; 