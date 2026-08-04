import { memo, useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    notation: 'standard',
    maximumFractionDigits: 0
  }).format(value);
};

const RevenueChart = memo(({ data, timeframe = 'monthly' }) => {
  // State management
  const [chartData, setChartData] = useState(null);
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2020');
  
  // Refs
  const dropdownRef = useRef(null);
  const chartRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowTimeframeDropdown(false);
      }
    };

    if (showTimeframeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
    return () => {};
  }, [showTimeframeDropdown]);
  
  // Format the data for the chart
  useEffect(() => {
    if (!data) return;
    
    // Extract data for income and expenses
    const incomeData = data?.income || [];
    const expenseData = data?.expense || [];
    const labels = data?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July'];
    
    // Calculate net profit
    const netProfit = incomeData.map((inc, index) => {
      const expense = expenseData[index] || 0;
      return inc - expense;
    });
    
    setChartData({
      labels,
      datasets: [
        {
          label: 'Net Profit',
          data: netProfit,
          borderColor: 'rgba(100, 143, 255, 0.8)',
          backgroundColor: 'rgba(100, 143, 255, 0.2)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
        },
        {
          label: 'Revenue',
          data: incomeData,
          borderColor: 'rgba(59, 130, 246, 0.8)',
          backgroundColor: 'rgba(59, 130, 246, 0.3)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
        }
      ]
    });
  }, [data, timeframe, selectedYear]);
  
  // Chart configuration
  const chartOptions = {
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
        border: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter, sans-serif',
          },
          color: '#64748b',
        },
      },
      y: {
        grid: {
          color: 'rgba(203, 213, 225, 0.2)',
          drawBorder: false,
        },
        border: {
          display: false,
        },
        min: 0,
        ticks: {
          stepSize: 30,
          padding: 10,
          font: {
            size: 11,
            family: 'Inter, sans-serif',
          },
          color: '#64748b',
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          padding: 20,
          font: {
            size: 12,
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#334155',
        bodyColor: '#64748b',
        borderColor: 'rgba(203, 213, 225, 0.5)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        bodyFont: {
          family: 'Inter, sans-serif',
          size: 12,
        },
        titleFont: {
          family: 'Inter, sans-serif',
          size: 14,
          weight: 'bold',
        },
        cornerRadius: 8,
        caretSize: 6,
        displayColors: true,
        callbacks: {
          title: function(tooltipItems) {
            return tooltipItems[0].label;
          },
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += formatCurrency(context.parsed.y);
            return label;
          },
        },
      },
    },
    animation: {
      duration: 800,
      easing: 'easeOutQuart',
    },
  };
  
  // Calculate totals
  const income = !data || !data.income 
    ? 0 
    : data.income.reduce((sum, val) => sum + val, 0);
  
  const expense = !data || !data.expense 
    ? 0 
    : data.expense.reduce((sum, val) => sum + val, 0);
  
  // Event handlers
  const selectYear = (year) => {
    setSelectedYear(year);
    setShowTimeframeDropdown(false);
    // In a real app, you'd fetch data for the selected year here
  };
  
  const toggleDropdown = () => {
    setShowTimeframeDropdown(!showTimeframeDropdown);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100/80 p-6 animate-fadeIn">
      {/* Header with Title and Time Filter */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div className="mb-2 md:mb-0">
          <h3 className="text-lg font-semibold text-gray-900">Revenue</h3>
          <p className="text-sm text-gray-500">Lorem ipsum dolor sit amet,consectetur</p>
        </div>
        
        {/* Timeframe Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            type="button" 
            onClick={toggleDropdown}
            className="inline-flex justify-center items-center rounded-full border border-blue-200 shadow-sm px-4 py-2 bg-white text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none transition duration-150"
            aria-expanded={showTimeframeDropdown ? 'true' : 'false'}
          >
            {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}
            <svg className="ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {/* Dropdown Menu */}
          {showTimeframeDropdown && (
            <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 animate-dropdownEnter">
              <div className="py-1">
                {['2020', '2019', '2018'].map(year => (
                  <button
                    key={year}
                    className={`${selectedYear === year ? 'bg-blue-50 text-blue-700' : 'text-gray-700'} block w-full text-left px-4 py-2 text-sm hover:bg-gray-100`}
                    onClick={() => selectYear(year)}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Income and Expense Summary */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg transition-all duration-200 hover:shadow-md">
          <div className="text-sm text-blue-600 mb-1 font-medium">Income</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(income)}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg transition-all duration-200 hover:shadow-md">
          <div className="text-sm text-gray-600 mb-1 font-medium">Expense</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(expense)}</div>
        </div>
      </div>
      
      {/* Chart */}
      <div className="h-[300px] relative mb-2">
        {chartData ? (
          <Line
            ref={chartRef}
            data={chartData}
            options={chartOptions}
            className="animate-chartFadeIn"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading chart data...</div>
          </div>
        )}
      </div>
    </div>
  );
});

RevenueChart.displayName = 'RevenueChart';

export default RevenueChart; 