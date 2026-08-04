// This file provides polyfills and replacements for React Native modules when used on the web

// Mapping of React Native components to Web equivalents
export const getWebComponent = (nativeComponentName) => {
  const componentMap = {
    // Add mappings for React Native components that cause issues
    'TextInput': 'input',
    'TouchableOpacity': 'button',
    'View': 'div',
    'Text': 'span',
    'ScrollView': 'div',
    'Image': 'img',
    // Add more mappings as needed
  };

  return componentMap[nativeComponentName] || 'div'; // Default to div if not mapped
};

// Helper to determine if code is running on web
export const isWeb = typeof window !== 'undefined' && window.document;

// Polyfill for Platform.OS
export const Platform = {
  OS: 'web',
  select: (obj) => obj.web || obj.default || {}
};

// Export empty implementations for native-only APIs
export const NativeModules = {};
export const NativeEventEmitter = function() {
  return {
    addListener: () => ({ remove: () => {} }),
    removeAllListeners: () => {}
  };
}; 