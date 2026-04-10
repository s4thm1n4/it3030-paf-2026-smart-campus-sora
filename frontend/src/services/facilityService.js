import api from './api';

const ENDPOINT = '/facilities';

const facilityService = {
  getAll: (params = {}) => api.get(ENDPOINT, { params }),
  getById: (id) => api.get(`${ENDPOINT}/${id}`),
  create: (data) => api.post(ENDPOINT, data),
  update: (id, data) => api.put(`${ENDPOINT}/${id}`, data),
  delete: (id) => api.delete(`${ENDPOINT}/${id}`),
};

export default facilityService;
