/**
 * Responsive utilities for web and mobile platforms
 * 
 * This module provides common functions for responsive design
 * that can be shared between the web and mobile apps
 */

/**
 * Get appropriate font size based on screen size
 * @param {number} baseFontSize - Base font size in pixels
 * @param {number} scaleFactor - Scale factor for larger screens
 * @param {number} screenWidth - Current screen width
 * @returns {number} - Calculated font size
 */
export const responsiveFontSize = (baseFontSize, scaleFactor = 0.1, screenWidth = 0) => {
  // For web, we use viewport width
  if (typeof window !== 'undefined') {
    const width = screenWidth || window.innerWidth;
    return baseFontSize + (width / 100) * scaleFactor;
  }
  
  // For React Native, this will be implemented differently
  return baseFontSize;
};

/**
 * Calculate responsive spacing/sizing based on screen dimensions
 * @param {number} baseSize - Base size in pixels
 * @param {number} scaleFactor - Scale factor for larger screens (percentage)
 * @param {number} screenWidth - Current screen width
 * @returns {number} - Calculated size
 */
export const responsiveSize = (baseSize, scaleFactor = 5, screenWidth = 0) => {
  if (typeof window !== 'undefined') {
    const width = screenWidth || window.innerWidth;
    return baseSize + (width / 100) * (scaleFactor / 100);
  }
  
  return baseSize;
};

/**
 * Media query breakpoints (matching Tailwind CSS defaults)
 * These are used for consistent breakpoints across the app
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Check if current screen width is within a certain breakpoint
 * @param {string} breakpoint - Breakpoint key (sm, md, lg, xl, 2xl)
 * @param {string} comparison - Comparison type ('up', 'down', 'only')
 * @returns {boolean} - Whether the condition is met
 */
export const useBreakpoint = (breakpoint, comparison = 'up') => {
  if (typeof window === 'undefined') return false;
  
  const width = window.innerWidth;
  const breakpointValue = breakpoints[breakpoint];
  
  if (!breakpointValue) return false;
  
  switch (comparison) {
    case 'up':
      return width >= breakpointValue;
    case 'down':
      return width < breakpointValue;
    case 'only':
      const nextBreakpoint = Object.keys(breakpoints).find(
        key => breakpoints[key] > breakpointValue
      );
      
      return width >= breakpointValue && 
        (!nextBreakpoint || width < breakpoints[nextBreakpoint]);
    default:
      return false;
  }
};

/**
 * Get the number of grid columns based on the current screen size
 * @param {Object} config - Configuration object with breakpoints and column counts
 * @param {number} config.xs - Number of columns for extra small screens (<640px)
 * @param {number} config.sm - Number of columns for small screens (≥640px)
 * @param {number} config.md - Number of columns for medium screens (≥768px)
 * @param {number} config.lg - Number of columns for large screens (≥1024px)
 * @param {number} config.xl - Number of columns for extra large screens (≥1280px)
 * @param {number} config.xxl - Number of columns for 2x extra large screens (≥1536px)
 * @returns {number} - The number of columns for the current screen size
 */
export const getGridColumns = (config = {}) => {
  const { xs = 1, sm = 2, md = 3, lg = 4, xl = 4, xxl = 4 } = config;
  
  if (typeof window === 'undefined') {
    return xs; // Default to xs for server-side rendering
  }
  
  const width = window.innerWidth;
  
  if (width >= 1536) {
    return xxl;
  } else if (width >= 1280) {
    return xl;
  } else if (width >= 1024) {
    return lg;
  } else if (width >= 768) {
    return md;
  } else if (width >= 640) {
    return sm;
  } else {
    return xs;
  }
};

/**
 * Check if the current screen size matches a given breakpoint
 * @param {string} breakpoint - The breakpoint to check (xs, sm, md, lg, xl, xxl)
 * @returns {boolean} - Whether the current screen size matches the breakpoint
 */
export const matchesBreakpoint = (breakpoint) => {
  if (typeof window === 'undefined') {
    return false; // Default to false for server-side rendering
  }
  
  const width = window.innerWidth;
  
  switch (breakpoint) {
    case 'xs': // Extra small screens (< 640px)
      return width < 640;
    case 'sm': // Small screens (≥ 640px)
      return width >= 640 && width < 768;
    case 'md': // Medium screens (≥ 768px)
      return width >= 768 && width < 1024;
    case 'lg': // Large screens (≥ 1024px)
      return width >= 1024 && width < 1280;
    case 'xl': // Extra large screens (≥ 1280px)
      return width >= 1280 && width < 1536;
    case 'xxl': // 2x extra large screens (≥ 1536px)
      return width >= 1536;
    default:
      return false;
  }
};

/**
 * Check if the current screen size is at least a given breakpoint
 * @param {string} breakpoint - The minimum breakpoint to check (xs, sm, md, lg, xl, xxl)
 * @returns {boolean} - Whether the current screen size is at least the given breakpoint
 */
export const isAtLeastBreakpoint = (breakpoint) => {
  if (typeof window === 'undefined') {
    return false; // Default to false for server-side rendering
  }
  
  const width = window.innerWidth;
  
  switch (breakpoint) {
    case 'xs': // At least extra small screens (≥ 0px)
      return true;
    case 'sm': // At least small screens (≥ 640px)
      return width >= 640;
    case 'md': // At least medium screens (≥ 768px)
      return width >= 768;
    case 'lg': // At least large screens (≥ 1024px)
      return width >= 1024;
    case 'xl': // At least extra large screens (≥ 1280px)
      return width >= 1280;
    case 'xxl': // At least 2x extra large screens (≥ 1536px)
      return width >= 1536;
    default:
      return false;
  }
}; 