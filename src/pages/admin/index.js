import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiUsers, FiUserCheck, FiSettings, FiLogOut } from 'react-icons/fi';
import SEO from '../../shared/components/SEO';

const AdminDashboard = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if admin is logged in
    const checkAuth = () => {
      try {
        console.log('Checking admin authentication...');
        const adminToken = localStorage.getItem('orderlyAdminToken');
        const adminDataStr = localStorage.getItem('orderlyAdminData');
        
        console.log('Admin token:', adminToken ? 'exists' : 'not found');
        console.log('Admin data:', adminDataStr ? 'exists' : 'not found');
        
        if (!adminToken) {
          console.log('No admin token found. Redirecting to login...');
          router.push('/admin/login');
          return;
        }
        
        if (adminDataStr) {
          try {
            const parsedData = JSON.parse(adminDataStr);
            console.log('Parsed admin data:', parsedData);
            if (parsedData && parsedData.role === 'admin') {
              setAdminData(parsedData);
              setIsAuthenticated(true);
              console.log('Admin authenticated successfully');
            } else {
              console.log('Invalid admin data. Redirecting to login...');
              handleLogout();
            }
          } catch (e) {
            console.error('Error parsing admin data:', e);
            handleLogout();
          }
        } else {
          console.log('No admin data found. Redirecting to login...');
          handleLogout();
        }
      } catch (error) {
        console.error('Authentication error:', error);
        handleLogout();
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('orderlyAdminToken');
    localStorage.removeItem('orderlyAdminData');
    setIsAuthenticated(false);
    setAdminData(null);
    router.push('/admin/login');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div className="flex justify-center items-center h-screen">Redirecting to login...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <SEO 
        title="Admin Dashboard" 
        description="Orderly Admin Dashboard" 
      />
      
      {/* Admin Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orderly Admin</h1>
            
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <FiLogOut className="mr-2" /> Logout
            </button>
          </div>
        </div>
      </header>
      
      {/* Admin Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Vendor Approvals Card */}
          <Link 
            href="/admin/vendor-approvals"
            className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <FiUserCheck className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Vendor Approvals</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Review and approve vendor registrations</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3">
              <div className="text-sm">
                <span className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800">Manage Vendors →</span>
              </div>
            </div>
          </Link>
          
          {/* Users Management Card */}
          <Link 
            href="/admin/users"
            className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <FiUsers className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">User Management</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage system users and permissions</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3">
              <div className="text-sm">
                <span className="font-medium text-green-600 dark:text-green-400 hover:text-green-800">Manage Users →</span>
              </div>
            </div>
          </Link>
          
          {/* Settings Card */}
          <Link 
            href="/admin/settings"
            className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-300"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <FiSettings className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">System Settings</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Configure application settings</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3">
              <div className="text-sm">
                <span className="font-medium text-purple-600 dark:text-purple-400 hover:text-purple-800">Manage Settings →</span>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard; 