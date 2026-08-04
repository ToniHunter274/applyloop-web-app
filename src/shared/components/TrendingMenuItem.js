import { memo, useState } from 'react';
import Image from 'next/image';

const TrendingMenuItem = memo(({ 
  image, 
  title, 
  price, 
  orderCount, 
  rankNumber 
}) => {
  const [imgSrc, setImgSrc] = useState(image);

  // Fallback image handling
  const handleImageError = () => {
    setImgSrc('/images/food-placeholder.jpg');
  };

  return (
    <div className="flex items-center py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors rounded-lg px-2">
      <div className="flex items-center flex-1">
        <div className="w-16 h-16 rounded-full overflow-hidden relative mr-4 border border-gray-200">
          <div className="relative w-full h-full">
            <Image 
              src={imgSrc} 
              alt={title} 
              width={64} 
              height={64}
              className="object-cover w-full h-full"
              onError={handleImageError}
            />
            <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shadow">
              #{rankNumber}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">₦{price.toFixed(1)}</p>
        </div>
      </div>

      <div className="text-right">
        <span className="text-sm text-gray-600">Order</span>
        <span className="ml-1 text-lg font-bold text-blue-600">{orderCount}x</span>
      </div>
    </div>
  );
});

TrendingMenuItem.displayName = 'TrendingMenuItem';

export default TrendingMenuItem; 