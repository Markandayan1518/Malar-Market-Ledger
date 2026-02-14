/**
 * Role-based access control utilities
 */

// User roles
export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  FARMER: 'farmer',
};

// Role permissions
export const PERMISSIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'view_dashboard',
  
  // Daily entries
  VIEW_DAILY_ENTRIES: 'view_daily_entries',
  CREATE_DAILY_ENTRY: 'create_daily_entry',
  EDIT_DAILY_ENTRY: 'edit_daily_entry',
  DELETE_DAILY_ENTRY: 'delete_daily_entry',
  
  // Farmers
  VIEW_FARMERS: 'view_farmers',
  CREATE_FARMER: 'create_farmer',
  EDIT_FARMER: 'edit_farmer',
  DELETE_FARMER: 'delete_farmer',
  
  // Market rates
  VIEW_MARKET_RATES: 'view_market_rates',
  CREATE_MARKET_RATE: 'create_market_rate',
  EDIT_MARKET_RATE: 'edit_market_rate',
  DELETE_MARKET_RATE: 'delete_market_rate',
  
  // Cash advances
  VIEW_CASH_ADVANCES: 'view_cash_advances',
  CREATE_CASH_ADVANCE: 'create_cash_advance',
  APPROVE_CASH_ADVANCE: 'approve_cash_advance',
  REJECT_CASH_ADVANCE: 'reject_cash_advance',
  
  // Settlements
  VIEW_SETTLEMENTS: 'view_settlements',
  CREATE_SETTLEMENT: 'create_settlement',
  APPROVE_SETTLEMENT: 'approve_settlement',
  MARK_SETTLEMENT_PAID: 'mark_settlement_paid',
  
  // Reports
  VIEW_REPORTS: 'view_reports',
  EXPORT_REPORTS: 'export_reports',
  
  // Settings
  VIEW_SETTINGS: 'view_settings',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_USERS: 'manage_users',
};

// Role to permissions mapping
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Dashboard
    PERMISSIONS.VIEW_DASHBOARD,
    
    // Daily entries
    PERMISSIONS.VIEW_DAILY_ENTRIES,
    PERMISSIONS.CREATE_DAILY_ENTRY,
    PERMISSIONS.EDIT_DAILY_ENTRY,
    PERMISSIONS.DELETE_DAILY_ENTRY,
    
    // Farmers
    PERMISSIONS.VIEW_FARMERS,
    PERMISSIONS.CREATE_FARMER,
    PERMISSIONS.EDIT_FARMER,
    PERMISSIONS.DELETE_FARMER,
    
    // Market rates
    PERMISSIONS.VIEW_MARKET_RATES,
    PERMISSIONS.CREATE_MARKET_RATE,
    PERMISSIONS.EDIT_MARKET_RATE,
    PERMISSIONS.DELETE_MARKET_RATE,
    
    // Cash advances
    PERMISSIONS.VIEW_CASH_ADVANCES,
    PERMISSIONS.CREATE_CASH_ADVANCE,
    PERMISSIONS.APPROVE_CASH_ADVANCE,
    PERMISSIONS.REJECT_CASH_ADVANCE,
    
    // Settlements
    PERMISSIONS.VIEW_SETTLEMENTS,
    PERMISSIONS.CREATE_SETTLEMENT,
    PERMISSIONS.APPROVE_SETTLEMENT,
    PERMISSIONS.MARK_SETTLEMENT_PAID,
    
    // Reports
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    
    // Settings
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.MANAGE_USERS,
  ],
  
  [ROLES.STAFF]: [
    // Dashboard
    PERMISSIONS.VIEW_DASHBOARD,
    
    // Daily entries
    PERMISSIONS.VIEW_DAILY_ENTRIES,
    PERMISSIONS.CREATE_DAILY_ENTRY,
    PERMISSIONS.EDIT_DAILY_ENTRY,
    
    // Farmers
    PERMISSIONS.VIEW_FARMERS,
    PERMISSIONS.CREATE_FARMER,
    PERMISSIONS.EDIT_FARMER,
    
    // Market rates (view only)
    PERMISSIONS.VIEW_MARKET_RATES,
    
    // Cash advances
    PERMISSIONS.VIEW_CASH_ADVANCES,
    PERMISSIONS.CREATE_CASH_ADVANCE,
    
    // Reports
    PERMISSIONS.VIEW_REPORTS,
  ],
  
  [ROLES.FARMER]: [
    // Dashboard
    PERMISSIONS.VIEW_DASHBOARD,
    
    // Daily entries (view own only)
    PERMISSIONS.VIEW_DAILY_ENTRIES,
    
    // Farmers (view own only)
    PERMISSIONS.VIEW_FARMERS,
    
    // Cash advances (view own only)
    PERMISSIONS.VIEW_CASH_ADVANCES,
    
    // Settlements (view own only)
    PERMISSIONS.VIEW_SETTLEMENTS,
  ],
};

// Route access by role
export const ROUTE_ACCESS = {
  '/dashboard': [ROLES.ADMIN, ROLES.STAFF, ROLES.FARMER],
  '/daily-entry': [ROLES.ADMIN, ROLES.STAFF],
  '/farmers': [ROLES.ADMIN, ROLES.STAFF, ROLES.FARMER],
  '/market-rates': [ROLES.ADMIN, ROLES.STAFF],
  '/cash-advances': [ROLES.ADMIN, ROLES.STAFF, ROLES.FARMER],
  '/settlements': [ROLES.ADMIN, ROLES.STAFF, ROLES.FARMER],
  '/reports': [ROLES.ADMIN, ROLES.STAFF],
  '/settings': [ROLES.ADMIN],
};

/**
 * Check if user has permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has permission
 */
export const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
};

/**
 * Check if user has any of the permissions
 * @param {string} role - User role
 * @param {Array<string>} permissions - Permissions to check
 * @returns {boolean} True if user has any permission
 */
export const hasAnyPermission = (role, permissions) => {
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Check if user has all permissions
 * @param {string} role - User role
 * @param {Array<string>} permissions - Permissions to check
 * @returns {boolean} True if user has all permissions
 */
export const hasAllPermissions = (role, permissions) => {
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Check if user can access route
 * @param {string} role - User role
 * @param {string} route - Route to check
 * @returns {boolean} True if user can access route
 */
export const canAccessRoute = (role, route) => {
  const allowedRoles = ROUTE_ACCESS[route];
  return allowedRoles ? allowedRoles.includes(role) : false;
};

/**
 * Get accessible routes for role
 * @param {string} role - User role
 * @returns {Array<string>} Accessible routes
 */
export const getAccessibleRoutes = (role) => {
  return Object.entries(ROUTE_ACCESS)
    .filter(([_, allowedRoles]) => allowedRoles.includes(role))
    .map(([route]) => route);
};

/**
 * Check if user is admin
 * @param {string} role - User role
 * @returns {boolean} True if admin
 */
export const isAdmin = (role) => {
  return role === ROLES.ADMIN;
};

/**
 * Check if user is staff
 * @param {string} role - User role
 * @returns {boolean} True if staff
 */
export const isStaff = (role) => {
  return role === ROLES.STAFF;
};

/**
 * Check if user is farmer
 * @param {string} role - User role
 * @returns {boolean} True if farmer
 */
export const isFarmer = (role) => {
  return role === ROLES.FARMER;
};

/**
 * Get role display name
 * @param {string} role - User role
 * @param {string} language - Language code (en|ta)
 * @returns {string} Role display name
 */
export const getRoleDisplayName = (role, language = 'en') => {
  const names = {
    en: {
      [ROLES.ADMIN]: 'Admin',
      [ROLES.STAFF]: 'Staff',
      [ROLES.FARMER]: 'Farmer',
    },
    ta: {
      [ROLES.ADMIN]: 'நிர்வாக்கர்',
      [ROLES.STAFF]: 'ஊழியர்',
      [ROLES.FARMER]: 'விவசாயி',
    },
  };
  return names[language]?.[role] || role;
};

/**
 * Get role hierarchy level (higher = more permissions)
 * @param {string} role - User role
 * @returns {number} Hierarchy level
 */
export const getRoleLevel = (role) => {
  const levels = {
    [ROLES.FARMER]: 1,
    [ROLES.STAFF]: 2,
    [ROLES.ADMIN]: 3,
  };
  return levels[role] || 0;
};

/**
 * Check if role1 has higher or equal level than role2
 * @param {string} role1 - First role
 * @param {string} role2 - Second role
 * @returns {boolean} True if role1 >= role2
 */
export const hasHigherOrEqualRole = (role1, role2) => {
  return getRoleLevel(role1) >= getRoleLevel(role2);
};

/**
 * Filter menu items by role
 * @param {Array} menuItems - Menu items to filter
 * @param {string} role - User role
 * @returns {Array} Filtered menu items
 */
export const filterMenuByRole = (menuItems, role) => {
  return menuItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  });
};

/**
 * Get default redirect path for role
 * @param {string} role - User role
 * @returns {string} Default redirect path
 */
export const getDefaultRedirect = (role) => {
  const redirects = {
    [ROLES.ADMIN]: '/dashboard',
    [ROLES.STAFF]: '/daily-entry',
    [ROLES.FARMER]: '/dashboard',
  };
  return redirects[role] || '/dashboard';
};
