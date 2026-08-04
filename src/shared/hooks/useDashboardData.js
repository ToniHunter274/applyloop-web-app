import { useState, useEffect, useCallback } from 'react';

// Custom hook for fetching and managing dashboard data
export const useDashboardData = (timeframe = 'monthly') => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    metrics: {
      menus: { value: 0, change: 0, chartData: [] },
      orders: { value: 0, change: 0, chartData: [] },
      customers: { value: 0, change: 0, chartData: [] },
      income: { value: 0, change: 0, chartData: [] },
    },
    revenue: {
      labels: [],
      income: [],
      expense: [],
    },
    customers: {
      labels: [],
      acquired: [],
      churned: [],
    },
    notifications: {
      alerts: 0,
      messages: 0,
      gifts: 0,
    },
    recentOrders: [],
    trendingMenus: []
  });

  // Simulated API fetch function
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock data based on timeframe
      let mockData;
      
      if (timeframe === 'monthly') {
        mockData = {
          metrics: {
            menus: { value: 45, change: 12.5, chartData: [10, 25, 30, 18, 32, 42, 45] },
            orders: { value: 456, change: 5.8, chartData: [320, 350, 390, 380, 400, 420, 456] },
            customers: { value: 287, change: -2.4, chartData: [300, 310, 290, 280, 285, 290, 287] },
            income: { value: 561623, change: 8.2, chartData: [400000, 450000, 490000, 510000, 530000, 550000, 561623] },
          },
          revenue: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            income: [561623, 450000, 380000, 420000, 490000, 530000, 610000],
            expense: [126621, 89000, 70000, 85000, 95000, 110000, 135000],
          },
          customers: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            acquired: [45, 50, 55, 48, 60, 58, 65],
            churned: [-20, -18, -22, -15, -19, -25, -18],
          },
          notifications: {
            alerts: 12,
            messages: 5,
            gifts: 2,
          },
          recentOrders: [
            {
              id: '0010235',
              title: 'Tuna Soup spinach with himalaya salt',
              customerName: 'Jimmy Kueai',
              location: 'South Corner st41255 london',
              price: 7.4,
              quantity: 3,
              status: 'PENDING',
              image: '/images/food-items/tuna-soup.jpg'
            },
            {
              id: '0010299',
              title: 'Mozarella Pizza With Random Topping',
              customerName: 'Kinda Alexa',
              location: 'Blue Ocean st.41551 London',
              price: 8.2,
              quantity: 1,
              status: 'DELIVERED',
              image: '/images/food-items/pizza.jpg'
            },
            {
              id: '0010235',
              title: 'Sweet Cheesy Pizza for Kids Meal (Small Size)',
              customerName: 'Peter Parkur',
              location: 'Franklin Avenue St.66125 London',
              price: 4.2,
              quantity: 2,
              status: 'CANCELED',
              image: '/images/food-items/sweet-pizza.jpg'
            },
            {
              id: '0010237',
              title: 'Tuna soup spinach with himalaya salt',
              customerName: 'Jimmy Kueai',
              location: 'South Corner st41255 london',
              price: 6.5,
              quantity: 4,
              status: 'DELIVERED',
              image: '/images/food-items/tuna-soup.jpg'
            },
            {
              id: '0010238',
              title: 'Mozarella Pizza With Random Topping',
              customerName: 'Cindy Alexa',
              location: 'Blue Ocean st.41551 London',
              price: 8.9,
              quantity: 5,
              status: 'PENDING',
              image: '/images/food-items/pizza.jpg'
            }
          ],
          trendingMenus: [
            {
              id: 1,
              title: 'Chicken curry special with cucumber',
              price: 5.6,
              orderCount: 90,
              image: '/images/food-items/chicken-curry.jpg'
            },
            {
              id: 2,
              title: 'Watermelon juice with ice',
              price: 4.8,
              orderCount: 70,
              image: '/images/food-items/watermelon-juice.jpg'
            },
            {
              id: 3,
              title: 'Italiano pizza with garlic',
              price: 12.3,
              orderCount: 60,
              image: '/images/food-items/italiano-pizza.jpg'
            },
            {
              id: 4,
              title: 'Tuna soup spinach with himalaya salt',
              price: 3.6,
              orderCount: 50,
              image: '/images/food-items/tuna-soup.jpg'
            },
            {
              id: 5,
              title: 'Medium Spicy Spaghetti Italiano',
              price: 4.2,
              orderCount: 40,
              image: '/images/food-items/spaghetti.jpg'
            }
          ]
        };
      } else if (timeframe === 'weekly') {
        mockData = {
          metrics: {
            menus: { value: 12, change: 15.0, chartData: [6, 8, 9, 10, 11, 12, 12] },
            orders: { value: 120, change: 8.5, chartData: [90, 95, 100, 105, 110, 115, 120] },
            customers: { value: 85, change: 4.2, chartData: [70, 75, 78, 80, 82, 84, 85] },
            income: { value: 2450, change: 10.5, chartData: [1800, 1900, 2100, 2200, 2300, 2400, 2450] },
          },
          revenue: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            income: [3500, 4200, 3800, 4500, 5000, 5800, 6200],
            expense: [2200, 2500, 2300, 2700, 3000, 3200, 3500],
          },
          customers: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            acquired: [12, 15, 10, 18, 20, 22, 25],
            churned: [-5, -6, -4, -7, -8, -10, -6],
          },
          notifications: {
            alerts: 5,
            messages: 2,
            gifts: 1,
          },
          recentOrders: [
            {
              id: '0010235',
              title: 'Tuna Soup spinach with himalaya salt',
              customerName: 'Jimmy Kueai',
              location: 'South Corner st41255 london',
              price: 7.4,
              quantity: 3,
              status: 'PENDING',
              image: '/images/food-items/tuna-soup.jpg'
            },
            {
              id: '0010299',
              title: 'Mozarella Pizza With Random Topping',
              customerName: 'Kinda Alexa',
              location: 'Blue Ocean st.41551 London',
              price: 8.2,
              quantity: 1,
              status: 'DELIVERED',
              image: '/images/food-items/pizza.jpg'
            },
            {
              id: '0010235',
              title: 'Sweet Cheesy Pizza for Kids Meal (Small Size)',
              customerName: 'Peter Parkur',
              location: 'Franklin Avenue St.66125 London',
              price: 4.2,
              quantity: 2,
              status: 'CANCELED',
              image: '/images/food-items/sweet-pizza.jpg'
            }
          ],
          trendingMenus: [
            {
              id: 1,
              title: 'Chicken curry special with cucumber',
              price: 5.6,
              orderCount: 35,
              image: '/images/food-items/chicken-curry.jpg'
            },
            {
              id: 2,
              title: 'Watermelon juice with ice',
              price: 4.8,
              orderCount: 28,
              image: '/images/food-items/watermelon-juice.jpg'
            },
            {
              id: 3,
              title: 'Italiano pizza with garlic',
              price: 12.3,
              orderCount: 24,
              image: '/images/food-items/italiano-pizza.jpg'
            }
          ]
        };
      } else { // daily
        mockData = {
          metrics: {
            menus: { value: 5, change: 20.0, chartData: [2, 3, 3, 4, 4, 5, 5] },
            orders: { value: 45, change: 12.3, chartData: [30, 32, 35, 38, 40, 43, 45] },
            customers: { value: 25, change: 8.7, chartData: [18, 20, 21, 22, 23, 24, 25] },
            income: { value: 850, change: 15.0, chartData: [600, 650, 700, 750, 780, 820, 850] },
          },
          revenue: {
            labels: ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM'],
            income: [500, 650, 850, 950, 800, 750, 700],
            expense: [300, 350, 450, 500, 450, 400, 350],
          },
          customers: {
            labels: ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM'],
            acquired: [4, 5, 7, 8, 6, 5, 4],
            churned: [-1, -2, -3, -2, -1, -1, -2],
          },
          notifications: {
            alerts: 2,
            messages: 1,
            gifts: 0,
          },
          recentOrders: [
            {
              id: '0010235',
              title: 'Tuna Soup spinach with himalaya salt',
              customerName: 'Jimmy Kueai',
              location: 'South Corner st41255 london',
              price: 7.4,
              quantity: 3,
              status: 'PENDING',
              image: '/images/food-items/tuna-soup.jpg'
            },
            {
              id: '0010299',
              title: 'Mozarella Pizza With Random Topping',
              customerName: 'Kinda Alexa',
              location: 'Blue Ocean st.41551 London',
              price: 8.2,
              quantity: 1,
              status: 'DELIVERED',
              image: '/images/food-items/pizza.jpg'
            }
          ],
          trendingMenus: [
            {
              id: 1,
              title: 'Chicken curry special with cucumber',
              price: 5.6,
              orderCount: 12,
              image: '/images/food-items/chicken-curry.jpg'
            },
            {
              id: 2,
              title: 'Watermelon juice with ice',
              price: 4.8,
              orderCount: 9,
              image: '/images/food-items/watermelon-juice.jpg'
            }
          ]
        };
      }
      
      setData(mockData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch dashboard data. Please try again.');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  // Fetch data initially and when timeframe changes
  useEffect(() => {
    fetchDashboardData();
    
    // Setup periodic refresh every 5 minutes
    const intervalId = setInterval(fetchDashboardData, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [fetchDashboardData]);

  return {
    loading,
    error,
    data,
    refreshData: fetchDashboardData
  };
};

export default useDashboardData; 