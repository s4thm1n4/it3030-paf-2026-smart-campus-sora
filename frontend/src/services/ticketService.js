import api from './api';

const ENDPOINT = '/tickets';

const ticketService = {
  getAll: () => api.get(ENDPOINT),
  getById: (id) => api.get(`${ENDPOINT}/${id}`),
  getMyTickets: () => api.get(`${ENDPOINT}/my`),
  create: (data) => api.post(ENDPOINT, data),
  update: (id, data) => api.put(`${ENDPOINT}/${id}`, data),
  updateStatus: (id, status) => api.patch(`${ENDPOINT}/${id}/status`, { status }),
  assign: (id, technicianId) => api.patch(`${ENDPOINT}/${id}/assign`, { technicianId }),
  delete: (id) => api.delete(`${ENDPOINT}/${id}`),

  // Comments
  getComments: (ticketId) => api.get(`${ENDPOINT}/${ticketId}/comments`),
  addComment: (ticketId, data) => api.post(`${ENDPOINT}/${ticketId}/comments`, data),
  updateComment: (ticketId, commentId, data) =>
    api.put(`${ENDPOINT}/${ticketId}/comments/${commentId}`, data),
  deleteComment: (ticketId, commentId) =>
    api.delete(`${ENDPOINT}/${ticketId}/comments/${commentId}`),
};

export default ticketService;
