import api from './api';

const ENDPOINT = '/notifications';

const notificationService = {
  getAll: () => api.get(ENDPOINT),
  getUnread: () => api.get(`${ENDPOINT}/unread`),
  getUnreadCount: () => api.get(`${ENDPOINT}/unread/count`),
  markAsRead: (id) => api.patch(`${ENDPOINT}/${id}/read`),
  markAllAsRead: () => api.patch(`${ENDPOINT}/read-all`),
};

export default notificationService;
