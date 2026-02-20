// Lazy-load sweetalert2 to prevent webpack chunk errors on page load
let _MySwal: any = null;

const getMySwal = async () => {
  if (!_MySwal) {
    const [{ default: Swal }, { default: withReactContent }] = await Promise.all([
      import('sweetalert2'),
      import('sweetalert2-react-content'),
    ]);
    _MySwal = withReactContent(Swal);
  }
  return _MySwal;
};

// Custom theme colors matching IndabaX branding
const customColors = {
  primary: '#e30045',
  success: '#28a745',
  error: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
};

// Default configuration
const defaultConfig = {
  confirmButtonColor: customColors.primary,
  cancelButtonColor: '#6c757d',
  customClass: {
    popup: 'sweetalert-popup',
    title: 'sweetalert-title',
    htmlContainer: 'sweetalert-text',
  },
};

/**
 * Show a success alert
 * @param title - Alert title
 * @param message - Alert message (optional)
 * @param timer - Auto close timer in ms (optional, default: 2000)
 */
export const showSuccess = async (
  title: string,
  message?: string,
  timer: number = 2000
) => {
  const MySwal = await getMySwal();
  return MySwal.fire({
    ...defaultConfig,
    icon: 'success',
    title,
    text: message,
    timer,
    showConfirmButton: !timer,
    timerProgressBar: !!timer,
  });
};

/**
 * Show an error alert
 * @param title - Alert title
 * @param message - Alert message (optional)
 */
export const showError = async (
  title: string,
  message?: string
) => {
  const MySwal = await getMySwal();
  return MySwal.fire({
    ...defaultConfig,
    icon: 'error',
    title,
    text: message,
    confirmButtonText: 'OK',
  });
};

/**
 * Show a warning alert
 * @param title - Alert title
 * @param message - Alert message (optional)
 */
export const showWarning = async (
  title: string,
  message?: string
) => {
  const MySwal = await getMySwal();
  return MySwal.fire({
    ...defaultConfig,
    icon: 'warning',
    title,
    text: message,
    confirmButtonText: 'OK',
  });
};

/**
 * Show an info alert
 * @param title - Alert title
 * @param message - Alert message (optional)
 */
export const showInfo = async (
  title: string,
  message?: string
) => {
  const MySwal = await getMySwal();
  return MySwal.fire({
    ...defaultConfig,
    icon: 'info',
    title,
    text: message,
    confirmButtonText: 'OK',
  });
};

/**
 * Show a confirmation dialog
 * @param title - Dialog title
 * @param message - Dialog message
 * @param confirmText - Confirm button text (default: "Yes")
 * @param cancelText - Cancel button text (default: "Cancel")
 * @returns Promise<boolean> - true if confirmed, false if cancelled
 */
export const showConfirmation = async (
  title: string,
  message: string,
  confirmText: string = 'Yes',
  cancelText: string = 'Cancel'
): Promise<boolean> => {
  const MySwal = await getMySwal();
  const result = await MySwal.fire({
    ...defaultConfig,
    icon: 'question',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
  });

  return result.isConfirmed;
};

/**
 * Show a confirmation dialog with icon
 * @param title - Dialog title
 * @param message - Dialog message
 * @param icon - Icon type (default: "question")
 * @returns Promise<boolean> - true if confirmed, false if cancelled
 */
export const showConfirm = async (
  title: string,
  message: string,
  icon: 'warning' | 'question' | 'info' = 'question'
): Promise<boolean> => {
  const MySwal = await getMySwal();
  const result = await MySwal.fire({
    ...defaultConfig,
    icon,
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: 'Yes',
    cancelButtonText: 'Cancel',
    confirmButtonColor: icon === 'warning' ? customColors.error : customColors.primary,
    reverseButtons: true,
  });

  return result.isConfirmed;
};

/**
 * Show a delete confirmation dialog
 * @param itemName - Name of the item to delete (e.g., "this post", "John Doe")
 * @returns Promise<boolean> - true if confirmed, false if cancelled
 */
export const showDeleteConfirmation = async (
  itemName?: string
): Promise<boolean> => {
  const MySwal = await getMySwal();
  const result = await MySwal.fire({
    ...defaultConfig,
    icon: 'warning',
    title: 'Are you sure?',
    text: itemName
      ? `You are about to delete ${itemName}. This action cannot be undone!`
      : 'This action cannot be undone!',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    confirmButtonColor: customColors.error,
    cancelButtonText: 'Cancel',
    reverseButtons: true,
  });

  return result.isConfirmed;
};

/**
 * Show a loading alert
 * @param title - Loading message (default: "Processing...")
 * @param allowClose - Allow user to close (default: false)
 */
export const showLoading = async (
  title: string = 'Processing...',
  allowClose: boolean = false
) => {
  const MySwal = await getMySwal();
  return MySwal.fire({
    ...defaultConfig,
    title,
    allowOutsideClick: allowClose,
    allowEscapeKey: allowClose,
    allowEnterKey: false,
    showConfirmButton: false,
    didOpen: () => {
      MySwal.showLoading();
    },
  });
};

/**
 * Close the current alert
 */
export const closeAlert = async () => {
  const MySwal = await getMySwal();
  MySwal.close();
};

/**
 * Show a toast notification (small, temporary alert)
 * @param title - Toast message
 * @param icon - Toast icon type
 * @param position - Toast position (default: "top-end")
 * @param timer - Auto close timer in ms (default: 3000)
 */
export const showToast = async (
  title: string,
  icon: 'success' | 'error' | 'warning' | 'info' = 'success',
  position: 'top' | 'top-start' | 'top-end' | 'center' | 'bottom' | 'bottom-start' | 'bottom-end' = 'top-end',
  timer: number = 3000
) => {
  const MySwal = await getMySwal();
  return MySwal.fire({
    toast: true,
    position,
    icon,
    title,
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
    didOpen: (toast: HTMLElement) => {
      toast.addEventListener('mouseenter', MySwal.stopTimer);
      toast.addEventListener('mouseleave', MySwal.resumeTimer);
    },
  });
};

/**
 * Show a form validation error
 * @param errors - Array of error messages or single error message
 */
export const showValidationError = async (errors: string[] | string) => {
  const errorList = Array.isArray(errors) ? errors : [errors];
  const errorHtml = errorList.length > 1
    ? `<ul style="text-align: left;">${errorList.map(err => `<li>${err}</li>`).join('')}</ul>`
    : errorList[0];

  const MySwal = await getMySwal();
  return MySwal.fire({
    ...defaultConfig,
    icon: 'error',
    title: 'Validation Error',
    html: errorHtml,
    confirmButtonText: 'OK',
  });
};

/**
 * Show a custom alert with HTML content
 * @param config - SweetAlert2 configuration object
 */
export const showCustomAlert = async (config: any) => {
  const MySwal = await getMySwal();
  return MySwal.fire({
    ...defaultConfig,
    ...config,
  });
};

/**
 * Show form submission success with redirect option
 * @param title - Success title
 * @param message - Success message
 * @param redirectUrl - URL to redirect to (optional)
 * @param redirectDelay - Delay before redirect in ms (default: 2000)
 */
export const showFormSuccess = async (
  title: string,
  message: string,
  redirectUrl?: string,
  redirectDelay: number = 2000
) => {
  const MySwal = await getMySwal();
  await MySwal.fire({
    ...defaultConfig,
    icon: 'success',
    title,
    text: message,
    timer: redirectDelay,
    timerProgressBar: true,
    showConfirmButton: false,
  });

  if (redirectUrl) {
    window.location.href = redirectUrl;
  }
};

/**
 * Show API error with technical details
 * @param userMessage - User-friendly error message
 * @param technicalDetails - Technical error details (optional, shown in collapsed section)
 */
export const showApiError = async (
  userMessage: string,
  technicalDetails?: string
) => {
  const html = technicalDetails
    ? `
      <p>${userMessage}</p>
      <details style="margin-top: 1rem; text-align: left;">
        <summary style="cursor: pointer; font-weight: 500;">Technical Details</summary>
        <pre style="margin-top: 0.5rem; padding: 0.5rem; background: #f5f5f5; border-radius: 4px; font-size: 0.875rem;">${technicalDetails}</pre>
      </details>
    `
    : userMessage;

  const MySwal = await getMySwal();
  return MySwal.fire({
    ...defaultConfig,
    icon: 'error',
    title: 'Error',
    html,
    confirmButtonText: 'OK',
  });
};

// Export a lazy getter for advanced usage
export const getSwal = getMySwal;

// Export MySwal getter (replaces direct MySwal export)
export { getMySwal as MySwal };
