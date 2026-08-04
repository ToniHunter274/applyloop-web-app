import { memo } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import chart components for code splitting
const DynamicLine = dynamic(() => import('react-chartjs-2').then(mod => mod.Line), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-full w-full rounded-md"></div>
});

// Memoized metric card component for better performance
const MetricCard = memo(({ title, value, change, chartData, icon }) => {
  const isPositive = change >= 0;
  
  return (
    <div className="bg-white rounded-lg shadow p-6 relative overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="absolute top-6 right-6 text-blue-200">
        {icon}
      </div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-3xl font-bold text-gray-900">{typeof value === 'number' && title === 'Income' ? '₦' : ''}{value}</h3>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
        <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? '+' : ''}{change}%
        </span>
      </div>
      <div className="h-16">
        <DynamicLine
          data={{
            labels: Array(10).fill(''),
            datasets: [{
              data: chartData,
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(0, 0, 0, 0)',
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 0,
            }]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false } },
            animation: {
              duration: 1500,
              easing: 'easeOutQuart'
            }
          }}
        />
      </div>
    </div>
  );
});

// Display name for React DevTools
MetricCard.displayName = 'MetricCard';

export default MetricCard; 