import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import Icon from '../../components/common/Icon';
import adminService from '../../services/adminService';

const ROLES = ['USER', 'ADMIN', 'TECHNICIAN', 'MANAGER'];

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(null);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers();
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setRoleLoading(userId);
    try {
      await adminService.updateRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success('Role updated');
    } catch (err) {
      console.error('Role update failed:', err);
      toast.error('Failed to update role');
    } finally {
      setRoleLoading(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-10 w-10 animate-spin rounded-none border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-on-surface">User Management</h1>
        <p className="text-sm text-on-surface-variant font-mono mt-1">
          // assign roles to platform users
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="label-caps text-on-surface-variant">
          All Users ({filteredUsers.length})
        </p>
        <div className="relative w-full sm:w-64">
          <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            placeholder="Search users..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full border border-cell-border bg-surface-container-lowest py-2 pl-9 pr-3 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <p className="border border-cell-border bg-surface-container-lowest p-8 text-center text-on-surface-variant">
          No users found.
        </p>
      ) : (
        <div className="overflow-x-auto border border-cell-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container text-on-surface-variant">
              <tr>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest">User</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest">Email</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest">Role</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest">Joined</th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cell-border">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="bg-surface hover:bg-surface-container-low transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.profilePictureUrl ? (
                        <img
                          src={u.profilePictureUrl}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-container font-display text-sm font-bold text-primary">
                          {u.name?.charAt(0) ?? '?'}
                        </div>
                      )}
                      <span className="font-medium text-on-surface">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-on-surface-variant">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider ${
                      u.role === 'ADMIN'
                        ? 'bg-primary-container text-primary'
                        : u.role === 'TECHNICIAN'
                          ? 'bg-accent-container text-accent'
                          : u.role === 'MANAGER'
                            ? 'bg-warning-container text-on-warning'
                            : 'bg-surface-container text-outline'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-outline">
                    {u.createdAt ? dayjs(u.createdAt).format('MMM D, YYYY') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={roleLoading === u.id}
                      className="border border-cell-border bg-surface-container-lowest px-2 py-1 text-xs text-on-surface focus:border-primary focus:outline-none disabled:opacity-50"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
