import api from './api';

const ENDPOINT = '/notifications';

const notificationService = {
  getAll: () => api.get(ENDPOINT),
  getUnread: () => api.get(`${ENDPOINT}/unread`),
  getUnreadCount: () => api.get(`${ENDPOINT}/unread/count`),
  markAsRead: (id) => api.put(`${ENDPOINT}/${id}/read`),
  markAllAsRead: () => api.put(`${ENDPOINT}/read-all`),
  delete: (id) => api.delete(`${ENDPOINT}/${id}`),
  create: (data) => api.post(ENDPOINT, data),
};

export default notificationService;
