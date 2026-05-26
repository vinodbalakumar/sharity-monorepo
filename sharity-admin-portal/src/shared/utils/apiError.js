export function apiErrorMessage(error, fallback = 'Something went wrong.') {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;

  if (Array.isArray(data.errors) && data.errors.length) {
    return data.errors.join(' ');
  }

  if (data.fieldErrors && typeof data.fieldErrors === 'object') {
    return Object.entries(data.fieldErrors)
      .flatMap(([field, messages]) => {
        const list = Array.isArray(messages) ? messages : [messages];
        return list.map((message) => `${field}: ${message}`);
      })
      .join(' ');
  }

  return data.detail || data.message || data.title || fallback;
}
