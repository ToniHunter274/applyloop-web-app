import { useState } from 'react';
import { FiChevronLeft, FiSearch, FiFilter, FiMoreHorizontal, FiCheck, FiX, FiStar } from 'react-icons/fi';
import SEO from '../shared/components/SEO';
import DashboardLayout from '../shared/components/DashboardLayout';

export default function Reviews() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedReviews, setSelectedReviews] = useState([]);
  
  // Mock review data
  const reviews = [
    {
      id: 'C012310',
      customer: {
        name: 'James Sitepu',
        avatar: '/avatars/james.jpg',
        orderId: 'RC012310'
      },
      date: '2023/04/23',
      time: '12:42 AM',
      rating: 4.5,
      comment: 'We recently had dinner with friends at David CC and we all walked away with a great experience. Good food, pleasant environment, personal attention through all the evening. Thanks to the team and we will be back!',
      responded: false
    },
    {
      id: 'C012324',
      customer: {
        name: 'Angela Moss',
        avatar: '/avatars/angela.jpg',
        orderId: 'RC012324'
      },
      date: '2023/04/23',
      time: '12:42 AM',
      rating: 4.5,
      comment: 'We recently had dinner with friends at David CC and we all walked away with a great experience. Good food, pleasant environment, personal attention through all the evening. Thanks to the team and we will be back!',
      responded: false
    },
    {
      id: 'C012325',
      customer: {
        name: 'Daphne Roshan',
        avatar: '/avatars/daphne.jpg',
        orderId: 'RC012325'
      },
      date: '2023/04/23',
      time: '12:42 AM',
      rating: 4.5,
      comment: 'We recently had dinner with friends at David CC and we all walked away with a great experience. Good food, pleasant environment, personal attention through all the evening. Thanks to the team and we will be back!',
      responded: false
    },
    {
      id: 'C012326',
      customer: {
        name: 'James Sitepu',
        avatar: '/avatars/james.jpg',
        orderId: 'RC012326'
      },
      date: '2023/04/23',
      time: '12:42 AM',
      rating: 4.5,
      comment: 'We recently had dinner with friends at David CC and we all walked away with a great experience. Good food, pleasant environment, personal attention through all the evening. Thanks to the team and we will be back!',
      responded: false
    },
    {
      id: 'C012327',
      customer: {
        name: 'Angela Moss',
        avatar: '/avatars/angela.jpg',
        orderId: 'RC012327'
      },
      date: '2023/04/23',
      time: '12:42 AM',
      rating: 4.5,
      comment: 'We recently had dinner with friends at David CC and we all walked away with a great experience. Good food, pleasant environment, personal attention through all the evening. Thanks to the team and we will be back!',
      responded: false
    },
    {
      id: 'C012328',
      customer: {
        name: 'Daphne Roshan',
        avatar: '/avatars/daphne.jpg',
        orderId: 'RC012328'
      },
      date: '2023/04/23',
      time: '12:42 AM',
      rating: 4.5,
      comment: 'We recently had dinner with friends at David CC and we all walked away with a great experience. Good food, pleasant environment, personal attention through all the evening. Thanks to the team and we will be back!',
      responded: false
    }
  ];
  
  // Handle checkbox selection
  const toggleSelectReview = (reviewId) => {
    if (selectedReviews.includes(reviewId)) {
      setSelectedReviews(selectedReviews.filter(id => id !== reviewId));
    } else {
      setSelectedReviews([...selectedReviews, reviewId]);
    }
  };
  
  // Render star rating
  const StarRating = ({ rating }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={i < fullStars ? "text-yellow-400" : (i === fullStars && hasHalfStar ? "text-yellow-400" : "text-gray-300")}>
            <FiStar className="w-4 h-4 fill-current" />
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <DashboardLayout>
      <SEO 
        title="Reviews" 
        description="Monitor and respond to customer reviews and feedback" 
      />
      
      {/* Header section with back button and title */}
      <div className="flex items-center mb-4">
        <button className="flex items-center text-blue-600 hover:text-blue-800 mr-2 transition-colors duration-200">
          <FiChevronLeft className="w-5 h-5" />
          <span className="ml-1">Back</span>
        </button>
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">Review</h1>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-500">Customer Review</span>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <button className={`px-4 py-2 rounded-full flex items-center transition-colors duration-200 ${activeTab === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}
            onClick={() => setActiveTab('all')}>
            <FiCheck className={`mr-1 ${activeTab === 'all' ? 'text-white' : 'text-green-500'}`} />
            <span>Positive</span>
          </button>
          <button className={`px-4 py-2 rounded-full flex items-center transition-colors duration-200 ${activeTab === 'negative' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600'}`}
            onClick={() => setActiveTab('negative')}>
            <FiX className={`mr-1 ${activeTab === 'negative' ? 'text-white' : 'text-red-500'}`} />
            <span>Negative</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search here"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 transition-all duration-200 hover:border-blue-300"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          <button className="px-4 py-2 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 flex items-center transition-colors duration-200">
            <FiFilter className="mr-1" />
            <span>Filter</span>
          </button>
          
          <div className="relative group">
            <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors duration-200">
              <FiMoreHorizontal />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block animate-dropdownEnter border border-gray-100">
              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150">Export Selected</button>
              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-150">Mark as Responded</button>
              <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150">Delete Selected</button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reviews list */}
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th scope="col" className="px-6 py-3 text-left">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    onChange={() => {
                      if (selectedReviews.length === reviews.length) {
                        setSelectedReviews([]);
                      } else {
                        setSelectedReviews(reviews.map(review => review.id));
                      }
                    }} 
                    checked={selectedReviews.length === reviews.length && reviews.length > 0}
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Review
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reviews.map((review, index) => (
                <tr key={review.id} className="hover:bg-blue-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input 
                      type="checkbox" 
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      checked={selectedReviews.includes(review.id)}
                      onChange={() => toggleSelectReview(review.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 relative">
                        <span className="absolute -top-1 -left-1 bg-blue-600 text-white text-xs rounded-full px-1 py-0.5 z-10">
                          #{review.customer.orderId}
                        </span>
                        <img 
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-gray-200" 
                          src={review.customer.avatar} 
                          alt={review.customer.name}
                          onError={(e) => {
                            if (typeof window !== 'undefined') {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.customer.name)}&background=random`;
                            }
                          }}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {review.customer.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {review.date} {review.time}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xl line-clamp-2">{review.comment}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-blue-600">{review.rating}</span>
                      <StarRating rating={review.rating} />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2 justify-end">
                      <button className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
                        <FiCheck className="mr-1" />
                        Approve
                      </button>
                      <button className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-full text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200">
                        <FiX className="mr-1" />
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{reviews.length}</span> of{' '}
                <span className="font-medium">{reviews.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">
                  1
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-600 text-sm font-medium text-white">
                  2
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">
                  3
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  ...
                </span>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">
                  8
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">
                  9
                </button>
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">
                  10
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200">
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 