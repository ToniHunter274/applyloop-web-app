import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { FiCheckCircle, FiArrowLeft, FiShoppingBag } from 'react-icons/fi';
import DashboardLayout from '../shared/components/DashboardLayout';
import SEO from '../shared/components/SEO';

const OrderSuccessPage = () => {
  const router = useRouter();
  const { orderId, total } = router.query;
  
  useEffect(() => {
    // If no orderId, redirect to the menu page
    if (!orderId && router.isReady) {
      router.push('/menu');
    }
  }, [orderId, router]);
  
  if (!orderId) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <DashboardLayout>
      <SEO 
        title="Order Placed Successfully" 
        description="Your order has been placed successfully" 
      />
      
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden p-8 text-center">
          <div className="flex justify-center mb-4">
            <FiCheckCircle className="text-green-500 h-20 w-20" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Thank You for Your Order!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your order has been placed successfully and is now being processed.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="mb-3">
              <span className="text-gray-500">Order ID:</span>
              <span className="ml-2 font-medium text-gray-900">{orderId}</span>
            </div>
            
            {total && (
              <div>
                <span className="text-gray-500">Total Amount:</span>
                <span className="ml-2 font-medium text-blue-600">₦{Number(total).toLocaleString()}</span>
              </div>
            )}
          </div>
          
          <p className="text-gray-600 mb-8">
            We have sent a confirmation receipt to your email address. You can track your order status in the Orders section.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/orders">
              <a className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors">
                <FiShoppingBag className="mr-2" />
                Track Your Order
              </a>
            </Link>
            
            <Link href="/menu">
              <a className="inline-flex items-center justify-center bg-gray-100 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-200 transition-colors">
                <FiArrowLeft className="mr-2" />
                Continue Shopping
              </a>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrderSuccessPage; 