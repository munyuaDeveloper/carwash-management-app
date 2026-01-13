/**
 * Offline Initializer Component
 * Initializes offline services and provides offline functionality
 */

import React, { useEffect } from 'react';
import { useOffline } from '../hooks/useOffline';
import { OfflineIndicator } from './OfflineIndicator';

interface OfflineInitializerProps {
  children: React.ReactNode;
}

export const OfflineInitializer: React.FC<OfflineInitializerProps> = ({ children }) => {
  // Initialize offline services
  useOffline();

  return (
    <>
      <OfflineIndicator />
      {children}
    </>
  );
};

