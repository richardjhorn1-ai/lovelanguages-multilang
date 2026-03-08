import { useEffect } from 'react';

export const useScrollablePage = () => {
  useEffect(() => {
    document.documentElement.classList.add('scrollable-page');

    return () => {
      document.documentElement.classList.remove('scrollable-page');
    };
  }, []);
};
