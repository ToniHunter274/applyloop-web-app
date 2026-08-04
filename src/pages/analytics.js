import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FiChevronRight, FiHeart, FiFilter, FiChevronDown } from 'react-icons/fi';
import SEO from '../shared/components/SEO';
import DashboardLayout from '../shared/components/DashboardLayout';

// Dynamically import chart components for code splitting
const DynamicLine = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-full w-full rounded-md"></div>
});

const DynamicBar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-full w-full rounded-md"></div>
});

const DynamicDoughnut = dynamic(() => import('react-chartjs-2').then(mod => mod.Doughnut), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-full w-full rounded-full"></div>
});

// Dynamically import Chart.js to reduce initial bundle size
import('chart.js').then(({ Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler }) => {
  Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);
});

// Component for progress circle
const ProgressCircle = ({ percentage, color }) => {
  const colors = {
    pink: 'text-pink-500 border-pink-500',
    blue: 'text-blue-600 border-blue-600',
    green: 'text-green-500 border-green-500',
  };
  
  return (
    <div className="relative w-16 h-16 animate-scaleIn">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle 
          className="text-gray-200" 
          strokeWidth="8" 
          stroke="currentColor" 
          fill="transparent" 
          r="40" 
          cx="50" 
          cy="50" 
        />
        <circle 
          className={`${colors[color] || 'text-pink-500'}`}
          strokeWidth="8" 
          strokeDasharray={`${percentage * 2.51}, 251.2`} 
          strokeLinecap="round" 
          stroke="currentColor" 
          fill="transparent" 
          r="40" 
          cx="50" 
          cy="50" 
          transform="rotate(-90 50 50)"
        />
        <text 
          x="50%" 
          y="50%" 
          dy=".3em" 
          textAnchor="middle" 
          className="text-sm font-medium"
          fill="currentColor"
        >
          {percentage}%
        </text>
      </svg>
    </div>
  );
};

// Food item card for analytics
const FoodItemCard = ({ item, rank }) => {
  return (
    <div className="flex items-center justify-between bg-white rounded-lg p-4 mb-4 hover:shadow-md transition-all duration-200 hover:border-blue-600 border border-transparent animate-fadeIn">
      <div className="flex items-center space-x-4">
        <img 
          src={item.image} 
          alt={item.title} 
          className="w-16 h-16 object-cover rounded-lg"
          onError={(e) => {
            if (typeof window !== 'undefined') {
              e.currentTarget.src = `https://via.placeholder.com/64x64?text=${encodeURIComponent(item.title)}`;
            }
          }}  
        />
        <div>
          <div className="flex items-center space-x-1">
            {Array(5).fill(0).map((_, i) => (
              <svg 
                key={i} 
                className={`w-4 h-4 ${i < Math.floor(item.rating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="text-xs text-gray-500">({item.reviews} reviews)</span>
          </div>
          <h3 className="text-sm font-medium text-gray-900">{item.title}</h3>
          <div className="flex items-center text-xs text-blue-600">
            <FiHeart className="mr-1" /> 
            {item.likes} Like it
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <svg className="h-5 w-8" viewBox="0 0 100 40">
              <polyline
                points={item.trendPoints}
                className="stroke-blue-600 fill-none"
                strokeWidth="8"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-sm text-blue-600 font-medium">{item.trend}%</span>
          </div>
          <span className="text-sm text-gray-500">{item.totalSales} sales</span>
        </div>
      </div>
    </div>
  );
};

// Trending menu item card
const TrendingMenuItem = ({ item, index }) => {
  return (
    <div className="flex items-center justify-between mb-4 p-3 hover:bg-blue-50 rounded-lg transition-colors duration-200 animate-fadeIn" style={{ animationDelay: `${index * 100}ms` }}>
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-sm">
            #{index}
          </div>
          <img 
            src={item.image} 
            alt={item.title} 
            className="w-14 h-14 rounded-lg object-cover"
            onError={(e) => {
              if (typeof window !== 'undefined') {
                e.currentTarget.src = `https://via.placeholder.com/56?text=${encodeURIComponent(index)}`;
              }
            }}
          />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{item.title}</h3>
          <p className="text-xs text-gray-500">₦{item.price.toFixed(1)}</p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <ProgressCircle percentage={item.percentage} color={
          item.percentage > 80 ? 'blue' : item.percentage > 60 ? 'blue' : 'green'
        } />
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          Order {item.orders}x
        </button>
      </div>
    </div>
  );
};

// Customer card for the loyal customers section
const CustomerCard = ({ customer, index }) => {
  return (
    <div className="flex items-center mb-4 bg-white p-3 rounded-lg hover:bg-blue-50 transition-colors duration-200 animate-fadeIn" style={{ animationDelay: `${index * 50}ms` }}>
      <img 
        src={customer.avatar} 
        alt={customer.name} 
        className="w-10 h-10 rounded-full object-cover mr-3"
        onError={(e) => {
          if (typeof window !== 'undefined') {
            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=random`;
          }
        }}
      />
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-900">{customer.name}</h3>
        <p className="text-xs text-gray-500">{customer.orders} Total order</p>
      </div>
    </div>
  );
};

// Custom dropdown component with visible text
const TimeframeDropdown = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const options = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'daily', label: 'Daily' }
  ];
  
  const currentOption = options.find(option => option.value === value) || options[0];
  
  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center justify-between w-32 px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{currentOption.label}</span>
        <FiChevronDown className={`ml-2 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 z-10 w-full mt-1 bg-white rounded-md shadow-lg animate-dropdownEnter border border-gray-200">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                className={`block w-full px-4 py-2 text-sm text-left ${
                  value === option.value 
                    ? 'bg-blue-50 text-blue-600 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function Analytics() {
  const [activeCategory, setActiveCategory] = useState('All Categories');
  const [timeframe, setTimeframe] = useState('monthly');
  const [animationActive, setAnimationActive] = useState(false);
  
  useEffect(() => {
    setAnimationActive(true);
  }, []);
  
  // Mock data for favorite items
  const favoriteItems = [
    {
      id: 1,
      title: 'Watermelon juice with ice',
      image: '/images/food-items/watermelon-juice.jpg',
      rating: 4.5,
      reviews: 454,
      likes: 258,
      trend: 45,
      trendPoints: '10,25 30,18 50,28 70,18 90,30',
      totalSales: 6732,
      category: 'Drink'
    },
    {
      id: 2,
      title: 'Medium Spicy Pizza with Kemangi Leaf',
      image: '/images/food-items/pizza.jpg',
      rating: 3.8,
      reviews: 454,
      likes: 258,
      trend: 26,
      trendPoints: '10,20 30,25 50,15 70,25 90,20',
      totalSales: 5721,
      category: 'Pizza'
    },
    {
      id: 3,
      title: 'Mozarella Pizza with Random Topping',
      image: '/images/food-items/italiano-pizza.jpg',
      rating: 3.9,
      reviews: 454,
      likes: 258,
      trend: 26,
      trendPoints: '10,20 30,25 50,15 70,25 90,20',
      totalSales: 3515,
      category: 'Pizza'
    }
  ];

  // Function to filter items based on active category
  const filteredItems = useMemo(() => {
    // Return all items for "All Categories" or "Main Course"
    if (activeCategory === 'All Categories' || activeCategory === 'Main Course') {
      return favoriteItems;
    }
    
    // Otherwise filter by the selected category
    return favoriteItems.filter(item => item.category === activeCategory);
  }, [activeCategory, favoriteItems]);

  // Mock data for daily trending menus
  const trendingMenus = [
    {
      id: 1,
      title: 'Chicken curry special with cucumber',
      price: 15.6,
      percentage: 87,
      orders: 90,
      image: '/images/food-items/chicken-curry.jpg'
    },
    {
      id: 2,
      title: 'Watermelon juice with ice',
      price: 4.8,
      percentage: 75,
      orders: 70,
      image: '/images/food-items/watermelon-juice.jpg'
    },
    {
      id: 3,
      title: 'Italiano pizza with garlic',
      price: 12.3,
      percentage: 90,
      orders: 60,
      image: '/images/food-items/italiano-pizza.jpg'
    },
    {
      id: 4,
      title: 'Tuna soup spinach with himalaya salt',
      price: 3.6,
      percentage: 50,
      orders: 50,
      image: '/images/food-items/tuna-soup.jpg'
    },
    {
      id: 5,
      title: 'Medium Spicy Spaghetti Italiano',
      price: 4.2,
      percentage: 40,
      orders: 40,
      image: '/images/food-items/spaghetti.jpg'
    }
  ];

  // Mock data for loyal customers
  const loyalCustomers = [
    {
      id: 1,
      name: 'Alexander Gunjo',
      orders: 52,
      avatar: '/avatars/alexander.jpg'
    },
    {
      id: 2,
      name: 'Babi Samogong',
      orders: 38,
      avatar: '/avatars/babi.jpg'
    },
    {
      id: 3,
      name: 'Jamil Alaba',
      orders: 105,
      avatar: '/avatars/jamil.jpg'
    },
    {
      id: 4,
      name: 'Kiblik Jamril',
      orders: 76,
      avatar: '/avatars/kiblik.jpg'
    }
  ];

  // Mock data for sales summary
  const salesData = {
    items: 63876,
    revenue: 873335,
    profit: 97126
  };

  // Revenue chart data
  const revenueChartData = useMemo(() => ({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        fill: true,
        label: 'Revenue',
        data: [60, 70, 80, 90, 100, 110, 100],
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(37, 99, 235)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgb(29, 78, 216)',
        pointHoverBorderColor: 'white',
        pointHoverBorderWidth: 3,
      }
    ]
  }), []);

  // Customer map chart data
  const customerMapData = useMemo(() => ({
    labels: ['4', '5', '6', '7', '8', '9', '10'],
    datasets: [
      {
        type: 'bar',
        label: 'Acquired',
        data: [20, 40, 60, 32, 50, 80, 30],
        backgroundColor: 'rgb(37, 99, 235)',
        barPercentage: 0.6,
      },
      {
        type: 'bar',
        label: 'Churned',
        data: [-30, -35, -20, -40, -35, -30, -40],
        backgroundColor: 'rgb(31, 41, 55)',
        barPercentage: 0.6,
      }
    ]
  }), []);

  return (
    <DashboardLayout>
      <SEO 
        title="Analytics" 
        description="Track your restaurant's performance with real-time analytics and insights" 
      />
      
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 ${animationActive ? 'animate-fadeIn' : 'opacity-0'}`}>
        {/* Most Favorite Items */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Most Favorites Items</h2>
              <p className="text-sm text-gray-500">Top rated items by your customers</p>
            </div>
            <div className="flex space-x-2 overflow-x-auto pb-2 custom-scrollbar">
              {['All Categories', 'Main Course', 'Pizza', 'Drink', 'Dessert', 'More'].map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setActiveCategory(category);
                  }}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    activeCategory === category
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 bg-gray-100 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <FoodItemCard key={item.id} item={item} rank={index + 1} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No items found in this category
              </div>
            )}
          </div>
          
          <div className="mt-6 text-center">
            <button className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium bg-blue-50 hover:bg-blue-100 transition-colors rounded-full px-4 py-2">
              View More <FiChevronRight className="ml-1" />
            </button>
          </div>
        </div>
        
        {/* Daily Trending Menus */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Daily Trending Menus</h2>
              <p className="text-sm text-gray-500">Top selling items today</p>
            </div>
            <button className="flex items-center text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full text-xs font-medium">
              <FiFilter className="mr-1" /> Filter
            </button>
          </div>
          
          <div className="space-y-2">
            {trendingMenus.map((item, index) => (
              <TrendingMenuItem key={item.id} item={item} index={index + 1} />
            ))}
          </div>

          {/* Best seller image */}
          <div className="mt-6 animate-fadeIn" style={{ animationDelay: '300ms' }}>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Best seller menus</h3>
            <p className="text-xs text-gray-500 mb-4">Most ordered item this month</p>
            
            <div className="relative rounded-lg overflow-hidden shadow-md group">
              <img 
                src="/images/food-items/pizza.jpg" 
                alt="Medium Spicy Pizza with Kemangi Leaf" 
                className="w-full h-48 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <h3 className="text-white font-medium">Medium Spicy Pizza with Kemangi Leaf</h3>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-white">₦6.53</p>
                  <div className="flex items-center">
                    <FiHeart className="text-blue-400 mr-1" />
                    <span className="text-white text-sm">258</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 ${animationActive ? 'animate-fadeIn' : 'opacity-0'}`} style={{ animationDelay: '150ms' }}>
        {/* Sales Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Sales Summary</h2>
              <p className="text-sm text-gray-500">Overview of your sales performance</p>
            </div>
            <TimeframeDropdown value={timeframe} onChange={setTimeframe} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-staggered-fadeIn">
            <div className="p-4 rounded-lg border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-blue-200 hover:bg-blue-50/30">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center animate-pulse-blue">
                  <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                </div>
                <span className="text-sm text-gray-500">Items Sold</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2 animate-valueUpdate">{salesData.items.toLocaleString()}</p>
            </div>
            
            <div className="p-4 rounded-lg border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-blue-200 hover:bg-blue-50/30">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center animate-pulse-blue">
                  <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                </div>
                <span className="text-sm text-gray-500">Revenue</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2 animate-valueUpdate">₦{salesData.revenue.toLocaleString()}</p>
            </div>
            
            <div className="p-4 rounded-lg border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-blue-200 hover:bg-blue-50/30">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center animate-pulse-blue">
                  <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                </div>
                <span className="text-sm text-gray-500">Profit (20%)</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2 animate-valueUpdate">₦{salesData.profit.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="h-72">
            <div className="h-full flex items-center justify-center">
              <div className="w-full h-full flex items-center justify-center animate-chartFadeIn">
                <DynamicDoughnut
                  data={{
                    labels: ['Items Sold', 'Revenue', 'Profit'],
                    datasets: [
                      {
                        data: [63876, 873335, 97126],
                        backgroundColor: [
                          'rgb(59, 130, 246)', // Blue 500
                          'rgb(37, 99, 235)',  // Blue 600
                          'rgb(29, 78, 216)',  // Blue 700
                        ],
                        borderWidth: 2,
                        borderColor: 'white',
                        hoverOffset: 15,
                        hoverBorderWidth: 0
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          padding: 20,
                          usePointStyle: true,
                          font: {
                            family: "'Inter', sans-serif",
                            size: 12,
                            weight: '500'
                          },
                          color: '#4B5563',
                          generateLabels: function(chart) {
                            const data = chart.data;
                            if (data.labels.length && data.datasets.length) {
                              return data.labels.map(function(label, i) {
                                const value = data.datasets[0].data[i];
                                let formattedValue = value.toLocaleString();
                                if (label === 'Revenue' || label === 'Profit') {
                                  formattedValue = '₦' + formattedValue;
                                }
                                return {
                                  text: `${label}: ${formattedValue}`,
                                  fillStyle: data.datasets[0].backgroundColor[i],
                                  strokeStyle: data.datasets[0].backgroundColor[i],
                                  lineWidth: 0,
                                  hidden: false,
                                  index: i
                                };
                              });
                            }
                            return [];
                          }
                        },
                      },
                      tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        titleFont: {
                          family: "'Inter', sans-serif",
                          size: 14
                        },
                        bodyFont: {
                          family: "'Inter', sans-serif",
                          size: 13
                        },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true,
                        usePointStyle: true,
                        titleColor: 'rgb(219, 234, 254)',
                        callbacks: {
                          label: function(context) {
                            let value = context.raw;
                            if (context.label === 'Revenue' || context.label === 'Profit') {
                              return `${context.label}: ₦${value.toLocaleString()}`;
                            }
                            return `${context.label}: ${value.toLocaleString()}`;
                          }
                        }
                      }
                    },
                    cutout: '70%',
                    animation: {
                      animateRotate: true,
                      animateScale: true,
                      duration: 1500,
                      easing: 'easeOutQuart'
                    },
                    elements: {
                      arc: {
                        borderWidth: 0
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Loyal Customers */}
        <div className="grid grid-rows-2 gap-6">
          {/* Loyal Customers List */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Loyal Customers</h2>
                <p className="text-sm text-gray-500">Top customers by order count</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {loyalCustomers.map((customer, index) => (
                <CustomerCard key={customer.id} customer={customer} index={index} />
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <button className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium bg-blue-50 hover:bg-blue-100 transition-colors rounded-full px-4 py-2">
                View More <FiChevronRight className="ml-1" />
              </button>
            </div>
          </div>
          
          {/* Best seller image */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Best seller menus</h3>
              <p className="text-sm text-gray-500">Top performing menu items</p>
            </div>
            
            <div className="relative rounded-lg overflow-hidden shadow-md group">
              <img 
                src="/images/food-items/pizza.jpg" 
                alt="Medium Spicy Pizza with Kemangi Leaf" 
                className="w-full h-48 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <h3 className="text-white font-medium">Medium Spicy Pizza with Kemangi Leaf</h3>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-white">₦6.53</p>
                  <div className="flex items-center">
                    <FiHeart className="text-blue-400 mr-1" />
                    <span className="text-white text-sm">258</span>
                    <span className="ml-4 bg-blue-600 rounded-full px-2 py-0.5 text-xs text-white">
                      6,732
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${animationActive ? 'animate-fadeIn' : 'opacity-0'}`} style={{ animationDelay: '300ms' }}>
        {/* Customer Map */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Customer Map</h2>
              <p className="text-sm text-gray-500">Customer acquisition and churn</p>
            </div>
            <TimeframeDropdown value={timeframe} onChange={setTimeframe} />
          </div>
          
          <div className="h-72">
            <div className="animate-chartFadeIn">
              <DynamicBar
                data={customerMapData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      grid: {
                        display: false,
                      },
                      ticks: {
                        font: {
                          family: "'Inter', sans-serif",
                        }
                      }
                    },
                    y: {
                      grid: {
                        borderDash: [3, 3],
                        color: 'rgba(37, 99, 235, 0.1)',
                      },
                      ticks: {
                        font: {
                          family: "'Inter', sans-serif",
                        },
                        callback: function(value) {
                          return Math.abs(value);
                        }
                      }
                    },
                  },
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top',
                      labels: {
                        usePointStyle: true,
                        font: {
                          family: "'Inter', sans-serif",
                          size: 12
                        }
                      }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(17, 24, 39, 0.9)',
                      titleFont: {
                        family: "'Inter', sans-serif",
                        size: 14
                      },
                      bodyFont: {
                        family: "'Inter', sans-serif",
                        size: 13
                      },
                      padding: 12,
                      cornerRadius: 8,
                      callbacks: {
                        label: function(context) {
                          let value = context.parsed.y;
                          return context.dataset.label + ': ' + Math.abs(value);
                        }
                      }
                    }
                  },
                  animation: {
                    delay: function(context) {
                      return context.dataIndex * 100;
                    },
                    duration: 1000,
                    easing: 'easeOutQuart'
                  },
                  transitions: {
                    active: {
                      animation: {
                        duration: 300
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Revenue */}
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Revenue</h2>
              <p className="text-sm text-gray-500">Monthly revenue overview</p>
            </div>
            <TimeframeDropdown value={timeframe} onChange={setTimeframe} />
          </div>
          
          <div className="h-72">
            <div className="animate-chartFadeIn">
              <DynamicLine
                data={revenueChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: {
                    mode: 'index',
                    intersect: false,
                  },
                  scales: {
                    x: {
                      grid: {
                        display: false,
                      },
                      ticks: {
                        font: {
                          family: "'Inter', sans-serif",
                        }
                      }
                    },
                    y: {
                      grid: {
                        borderDash: [3, 3],
                        color: 'rgba(37, 99, 235, 0.1)',
                      },
                      ticks: {
                        callback: function(value) {
                          return '₦' + value;
                        },
                        font: {
                          family: "'Inter', sans-serif",
                        }
                      }
                    },
                  },
                  plugins: {
                    legend: {
                      display: false,
                    },
                    tooltip: {
                      backgroundColor: 'rgba(17, 24, 39, 0.9)',
                      titleFont: {
                        family: "'Inter', sans-serif",
                        size: 14
                      },
                      bodyFont: {
                        family: "'Inter', sans-serif",
                        size: 13
                      },
                      padding: 12,
                      cornerRadius: 8,
                      callbacks: {
                        title: function(tooltipItems) {
                          return tooltipItems[0].label;
                        },
                        label: function(context) {
                          let label = context.dataset.label || '';
                          if (label) {
                            label += ': ';
                          }
                          label += '₦' + context.parsed.y;
                          return label;
                        },
                      },
                      titleColor: 'rgb(219, 234, 254)',
                      bodyColor: 'rgb(255, 255, 255)',
                      borderColor: 'rgba(37, 99, 235, 0.3)',
                      borderWidth: 1,
                      displayColors: true,
                      boxPadding: 3,
                    },
                  },
                  elements: {
                    line: {
                      tension: 0.4
                    },
                    point: {
                      radius: 4,
                      hitRadius: 10,
                      hoverRadius: 6,
                      hoverBorderWidth: 2
                    }
                  },
                  animation: {
                    duration: 1200,
                    easing: 'easeOutQuart'
                  },
                  transitions: {
                    active: {
                      animation: {
                        duration: 300
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 