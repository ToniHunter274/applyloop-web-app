import SEO from '../shared/components/SEO';
import DashboardLayout from '../shared/components/DashboardLayout';

export default function Regions() {
  return (
    <DashboardLayout>
      <SEO 
        title="Regions" 
        description="Manage your restaurant's regional settings and delivery zones" 
      />
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Regions</h2>
        <p className="text-gray-500">This page is under construction. Content will be added soon.</p>
      </div>
    </DashboardLayout>
  );
} 