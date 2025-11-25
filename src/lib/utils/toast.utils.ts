/**
 * Toast Notification Utility
 * 
 * Display success, error, and warning toast messages
 */

import { toast } from 'sonner';

export class ToastService {
  /**
   * Show success toast notification
   * @param message Success message to display
   * @param duration Duration in milliseconds (default: 5000)
   */
  static showSuccess(message: string, duration: number = 5000): void {
    toast.success(message, {
      duration,
      position: 'top-right',
      className: 'toast-success',
      style: {
        background: '#3B82F6',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '0.75rem',
        padding: '1rem 1.25rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    });
  }

  /**
   * Show error toast notification
   * @param message Error message to display
   * @param duration Duration in milliseconds (default: 5000)
   */
  static showError(message: string, duration: number = 5000): void {
    toast.error(message, {
      duration,
      position: 'top-right',
      className: 'toast-error',
      style: {
        background: '#EF4444',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '0.75rem',
        padding: '1rem 1.25rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    });
  }

  /**
   * Show warning toast notification
   * @param message Warning message to display
   * @param duration Duration in milliseconds (default: 5000)
   */
  static showWarning(message: string, duration: number = 5000): void {
    toast.warning(message, {
      duration,
      position: 'top-right',
      className: 'toast-warning',
      style: {
        background: '#F59E0B',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '0.75rem',
        padding: '1rem 1.25rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    });
  }

  /**
   * Show info toast notification
   * @param message Info message to display
   * @param duration Duration in milliseconds (default: 5000)
   */
  static showInfo(message: string, duration: number = 5000): void {
    toast.info(message, {
      duration,
      position: 'top-right',
      className: 'toast-info',
      style: {
        background: '#06B6D4',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '0.75rem',
        padding: '1rem 1.25rem',
        fontSize: '0.875rem',
        fontWeight: '500',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    });
  }
}

// Export convenience functions
export const showSuccessAlert = (message: string) => ToastService.showSuccess(message);
export const showErrorAlert = (message: string) => ToastService.showError(message);
export const showWarningAlert = (message: string) => ToastService.showWarning(message);
export const showInfoAlert = (message: string) => ToastService.showInfo(message);
