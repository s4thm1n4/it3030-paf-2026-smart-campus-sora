import api from './api';

const ENDPOINT = '/bookings';

const bookingService = {
  getAll: () => api.get(ENDPOINT),
  getById: (id) => api.get(`${ENDPOINT}/${id}`),
  getMyBookings: () => api.get(`${ENDPOINT}/my`),
  create: (data) => api.post(ENDPOINT, data),
  cancel: (id) => api.patch(`${ENDPOINT}/${id}/cancel`),
  approve: (id, remarks) => api.patch(`${ENDPOINT}/${id}/approve`, { remarks }),
  reject: (id, remarks) => api.patch(`${ENDPOINT}/${id}/reject`, { remarks }),
};

export default bookingService;
