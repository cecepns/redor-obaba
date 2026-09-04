import api from './api';
import toast from 'react-hot-toast';

/**
 * Reusable API request wrapper with standardized error handling and toast alerts
 */
export const request = async ({
  url,
  method = 'GET',
  data = null,
  params = null,
  headers = {},
  showSuccessToast = false,
  successMessage = '',
  showErrorToast = true,
}) => {
  try {
    const config = {
      url,
      method,
      headers,
    };

    if (params) {
      config.params = params;
    }

    if (data) {
      config.data = data;
    }

    const response = await api(config);

    if (showSuccessToast) {
      const msg = successMessage || response.data?.message || 'Operasi berhasil dilakukan!';
      toast.success(msg);
    }

    return response.data;
  } catch (error) {
    const errorMsg =
      error.response?.data?.message ||
      error.message ||
      'Terjadi kesalahan saat memproses data.';

    if (showErrorToast) {
      toast.error(errorMsg);
    }

    throw error;
  }
};

export default request;
