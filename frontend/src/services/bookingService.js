import api from './api';

const ENDPOINT = '/bookings';

const bookingService = {
  getAll: (params) => api.get(ENDPOINT, { params }),
  getById: (id) => api.get(`${ENDPOINT}/${id}`),
  getMyBookings: () => api.get(`${ENDPOINT}/my`),
  create: (data) => api.post(ENDPOINT, data),
  update: (id, data) => api.put(`${ENDPOINT}/${id}`, data),
  delete: (id) => api.delete(`${ENDPOINT}/${id}`),
  cancel: (id) => api.patch(`${ENDPOINT}/${id}/cancel`),
  approve: (id, remarks) => api.patch(`${ENDPOINT}/${id}/approve`, { remarks }),
  reject: (id, remarks) => api.patch(`${ENDPOINT}/${id}/reject`, { remarks }),
};

export default bookingService;
