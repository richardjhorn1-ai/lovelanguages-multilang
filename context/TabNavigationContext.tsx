'use client';

import { createContext, useContext } from 'react';

type TabNavigationContextType = {
  navigateTab: (path: string) => void;
};

const TabNavigationContext = createContext<TabNavigationContextType>({
  navigateTab: () => {},
});

export const useTabNavigation = () => useContext(TabNavigationContext);
export const TabNavigationProvider = TabNavigationContext.Provider;
