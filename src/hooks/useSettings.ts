import { useState } from 'react';
import useAuthStore from '../stores/useAuthStore';

export const useSettings = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { signOut, user } = useAuthStore();

  const exportData = async () => {
    setIsExporting(true);
    try {
      // TODO: Implement data export functionality
      console.log('Exporting data for user:', user?.id);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate export
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const deleteAccount = async () => {
    try {
      // TODO: Implement account deletion
      console.log('Deleting account for user:', user?.id);
      await signOut();
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  return {
    user,
    isExporting,
    exportData,
    deleteAccount,
    signOut,
  };
}; 