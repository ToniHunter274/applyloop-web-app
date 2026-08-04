import React from 'react';
import { CartProvider } from '../hooks/useCart';
import { VendorProfileProvider } from '../hooks/useVendorProfile';
import { ThemeProvider } from '../hooks/useTheme';
import { VendorStatusProvider } from '../hooks/useVendorStatus';

/**
 * AppProvider combines all our context providers into a single component
 * This makes it easier to wrap the application with all required providers
 */
const AppProvider = ({ children }) => {
  return (
    <ThemeProvider>
      <VendorProfileProvider>
        <VendorStatusProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </VendorStatusProvider>
      </VendorProfileProvider>
    </ThemeProvider>
  );
};

export default AppProvider; 