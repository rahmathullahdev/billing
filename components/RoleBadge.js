const ROLE_MAP = {
  ROLE_ADMIN: { label: 'Admin', className: 'role-admin' },
  ROLE_MANAGER: { label: 'Manager', className: 'role-manager' },
  ROLE_USER: { label: 'Employee', className: 'role-user' },
};

export default function RoleBadge({ role, className = '' }) {
  const meta = ROLE_MAP[role] || { label: 'User', className: 'role-user' };
  return <span className={`role-badge ${meta.className} ${className}`}>{meta.label}</span>;
}
