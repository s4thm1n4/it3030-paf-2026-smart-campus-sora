/**
 * Normalizes Spring GlobalExceptionHandler + validation payloads for UI messages.
 */
export function getApiErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) {
    return error?.message || 'Something went wrong';
  }
  if (typeof data.message === 'string' && data.message) {
    return data.message;
  }
  if (data.fieldErrors && typeof data.fieldErrors === 'object') {
    const vals = Object.values(data.fieldErrors);
    if (vals.length > 0 && typeof vals[0] === 'string') {
      return vals[0];
    }
  }
  if (data.error && typeof data.error === 'string') {
    return data.error;
  }
  return 'Request failed';
}
