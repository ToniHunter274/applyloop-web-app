import { memo } from 'react';

const SectionCard = memo(({ title, subtitle, children, action }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 transition-all duration-300 hover:shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
});

SectionCard.displayName = 'SectionCard';

export default SectionCard; 