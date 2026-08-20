import React from 'react';
import { ThemeProvider } from '../hooks/useTheme';

const AppProvider = ({ children }) => {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
};

export default AppProvider;
