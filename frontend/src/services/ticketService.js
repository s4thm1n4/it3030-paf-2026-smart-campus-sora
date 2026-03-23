import api from './api';

const ENDPOINT = '/tickets';

const ticketService = {
  /** ADMIN, TECHNICIAN, MANAGER */
  getAll: () => api.get(`${ENDPOINT}/all`),
  /** TECHNICIAN — tickets assigned to current user */
  getAssigned: () => api.get(`${ENDPOINT}/assigned`),
  getById: (id) => api.get(`${ENDPOINT}/${id}`),
  getMyTickets: () => api.get(`${ENDPOINT}/my`),
  /** ADMIN — for assign dropdown */
  getTechnicians: () => api.get(`${ENDPOINT}/technicians`),
  /** Let Axios set multipart boundary — do not set Content-Type manually */
  create: (formData) => api.post(ENDPOINT, formData),
  update: (id, data) => api.put(`${ENDPOINT}/${id}`, data),
  updateStatus: (id, payload) => api.patch(`${ENDPOINT}/${id}/status`, payload),
  assign: (id, technicianId) => api.patch(`${ENDPOINT}/${id}/assign`, { technicianId }),
  delete: (id) => api.delete(`${ENDPOINT}/${id}`),

  getComments: (ticketId) => api.get(`${ENDPOINT}/${ticketId}/comments`),
  addComment: (ticketId, data) => api.post(`${ENDPOINT}/${ticketId}/comments`, data),
  updateComment: (ticketId, commentId, data) =>
    api.put(`${ENDPOINT}/${ticketId}/comments/${commentId}`, data),
  deleteComment: (ticketId, commentId) =>
    api.delete(`${ENDPOINT}/${ticketId}/comments/${commentId}`),
};

export default ticketService;
