import api from './api';

const ENDPOINT = '/facilities';

const facilityService = {
  getAll: () => api.get(ENDPOINT),
  getById: (id) => api.get(`${ENDPOINT}/${id}`),
  create: (data) => api.post(ENDPOINT, data),
  update: (id, data) => api.put(`${ENDPOINT}/${id}`, data),
  delete: (id) => api.delete(`${ENDPOINT}/${id}`),
  search: (params) => api.get(`${ENDPOINT}/search`, { params }),
};

export default facilityService;
