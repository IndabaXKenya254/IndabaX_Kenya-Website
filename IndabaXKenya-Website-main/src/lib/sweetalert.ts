import { getFieldLabel, parseValidationErrors, formatZodErrors } from './field-labels';

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

export const showDeleteConfirmation = async (
  itemName?: string,
  options?: {
    text?: string
    title?: string
    confirmButtonText?: string
  }
): Promise<boolean> => {
  const MySwal = await getMySwal();
  const result = await MySwal.fire({
    ...defaultConfig,
    icon: 'warning',
    title: options?.title || 'Are you sure?',
    text: options?.text || (itemName
      ? `You are about to delete ${itemName}. This action cannot be undone!`
      : 'This action cannot be undone!'),
    showCancelButton: true,
    confirmButtonText: options?.confirmButtonText || 'Yes, delete it!',
    confirmButtonColor: customColors.error,
    cancelButtonText: 'Cancel',
    reverseButtons: true,
  });

  return result.isConfirmed;
};

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

export const closeAlert = async () => {
  const MySwal = await getMySwal();
  MySwal.close();
};

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

export const showValidationError = async (errors: string[] | string) => {
  const errorList = Array.isArray(errors) ? errors : [errors];
  const errorHtml = errorList.length > 1
    ? `<ul style="text-align: left; margin: 0; padding-left: 1.5rem;">${errorList.map(err => `<li style="margin-bottom: 0.5rem;">${err}</li>`).join('')}</ul>`
    : errorList[0];

  const MySwal = await getMySwal();
  return MySwal.fire({
    ...defaultConfig,
    icon: 'error',
    title: 'Please Fix The Following',
    html: errorHtml,
    confirmButtonText: 'OK',
  });
};

export const showFormError = async (
  errorString: string,
  title: string = 'Please Fix The Following'
) => {
  const errors = parseValidationErrors(errorString);

  const errorHtml = errors.length > 1
    ? `<ul style="text-align: left; margin: 0; padding-left: 1.5rem;">${errors.map(err => `<li style="margin-bottom: 0.5rem;">${err}</li>`).join('')}</ul>`
    : `<p style="margin: 0;">${errors[0]}</p>`;

  const MySwal = await getMySwal();
  return MySwal.fire({
    ...defaultConfig,
    icon: 'error',
    title,
    html: errorHtml,
    confirmButtonText: 'OK',
  });
};

export const showZodValidationErrors = async (
  zodErrors: Array<{ path: (string | number)[]; message: string }>,
  title: string = 'Please Fix The Following'
) => {
  const errors = formatZodErrors(zodErrors);

  const errorHtml = errors.length > 1
    ? `<ul style="text-align: left; margin: 0; padding-left: 1.5rem;">${errors.map(err => `<li style="margin-bottom: 0.5rem;">${err}</li>`).join('')}</ul>`
    : `<p style="margin: 0;">${errors[0]}</p>`;

  const MySwal = await getMySwal();
  return MySwal.fire({
    ...defaultConfig,
    icon: 'error',
    title,
    html: errorHtml,
    confirmButtonText: 'OK',
  });
};

export const showRequiredFieldsError = async (fields: string[]) => {
  const friendlyFields = fields.map(field => getFieldLabel(field));

  const errorHtml = `
    <p style="margin-bottom: 1rem;">Please fill in the following required fields:</p>
    <ul style="text-align: left; margin: 0; padding-left: 1.5rem;">
      ${friendlyFields.map(field => `<li style="margin-bottom: 0.5rem;">${field}</li>`).join('')}
    </ul>
  `;

  const MySwal = await getMySwal();
  return MySwal.fire({
    ...defaultConfig,
    icon: 'warning',
    title: 'Required Fields Missing',
    html: errorHtml,
    confirmButtonText: 'OK',
  });
};

export const showCustomAlert = async (config: any) => {
  const MySwal = await getMySwal();
  return MySwal.fire({
    ...defaultConfig,
    ...config,
  });
};

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
