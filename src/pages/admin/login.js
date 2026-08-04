import { useState } from 'react';
import { useRouter } from 'next/router';
import { FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import SEO from '../../shared/components/SEO';
import apiService from '../../shared/services/api';

const AdminLogin = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      // In a real application, this would use the API service
      // const response = await apiService.admin.login({ email, password });
      
      // For demo purposes, we'll simulate a successful login with hardcoded credentials
      if (email === 'admin@orderly.com' && password === 'admin123') {
        // Create admin token and data
        const adminData = {
          name: 'Admin User',
          email: email,
          role: 'admin',
          lastLogin: new Date().toISOString()
        };

        // Store admin data in localStorage
        const token = 'demo-admin-token-' + Date.now();
        localStorage.setItem('orderlyAdminToken', token);
        localStorage.setItem('orderlyAdminData', JSON.stringify(adminData));
        
        // Initialize vendors array if it doesn't exist
        if (!localStorage.getItem('orderlyVendors')) {
          // Create some demo vendors
          const demoVendors = [
            {
              id: 'vendor_1',
              name: 'John Restaurant',
              email: 'john@example.com',
              phone: '+1234567890',
              address: '123 Main St, New York',
              verificationStatus: 'Pending',
              registeredAt: new Date().toISOString(),
              vendorName: 'John Steakhouse'
            },
            {
              id: 'vendor_2',
              name: 'Sarah Diner',
              email: 'sarah@example.com',
              phone: '+9876543210',
              address: '456 Oak Ave, Chicago',
              verificationStatus: 'Approved',
              registeredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              vendorName: 'Sarah\'s Salads'
            }
          ];
          localStorage.setItem('orderlyVendors', JSON.stringify(demoVendors));
        }

        console.log('Admin login successful');
        // Redirect to admin dashboard
        router.push('/admin');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <SEO
        title="Admin Login"
        description="Orderly Admin Login"
      />

      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your credentials to access the admin dashboard
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Demo Credentials:</p>
            <p>Email: admin@orderly.com</p>
            <p>Password: admin123</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin; 