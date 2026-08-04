import React, { useState, useEffect, useRef } from 'react';

const ScaleContainer = ({ children, referenceWidth = 1440, referenceHeight = 900 }) => {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !wrapperRef.current) return;

      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      const scaleX = containerWidth / referenceWidth;
      const scaleY = containerHeight / referenceHeight;
      
      // Use the minimum scale factor to ensure everything fits inside
      const newScale = Math.min(scaleX, scaleY, 1); // Avoid scaling larger than 1 to prevent blurriness
      setScale(newScale);
    };

    window.addEventListener('resize', handleResize);
    // Initial scaling
    handleResize();

    // Resize observer for parent container layout changes
    let observer;
    if (containerRef.current) {
      observer = new ResizeObserver(() => handleResize());
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
    };
  }, [referenceWidth, referenceHeight]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-screen overflow-auto bg-gray-50 dark:bg-gray-950 flex items-center justify-center"
    >
      <div 
        ref={wrapperRef}
        className="origin-center transition-transform duration-200 ease-out"
        style={{
          width: `${referenceWidth}px`,
          height: `${referenceHeight}px`,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default ScaleContainer;
