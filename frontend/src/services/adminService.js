import api from './api';

const adminService = {
  getUsers: () => api.get('/admin/users'),
  updateRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
};

export default adminService;
