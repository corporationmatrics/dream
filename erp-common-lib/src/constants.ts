export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  AUTH_REGISTER: '/auth/register',
  AUTH_REFRESH: '/auth/refresh',

  // Users
  USERS_LIST: '/users',
  USERS_GET: (id: string) => `/users/${id}`,
  USERS_CREATE: '/users',
  USERS_UPDATE: (id: string) => `/users/${id}`,
  USERS_DELETE: (id: string) => `/users/${id}`,

  // Products
  PRODUCTS_LIST: '/products',
  PRODUCTS_GET: (id: string) => `/products/${id}`,
  PRODUCTS_CREATE: '/products',
  PRODUCTS_UPDATE: (id: string) => `/products/${id}`,
  PRODUCTS_DELETE: (id: string) => `/products/${id}`,

  // Orders
  ORDERS_LIST: '/orders',
  ORDERS_GET: (id: string) => `/orders/${id}`,
  ORDERS_CREATE: '/orders',
  ORDERS_UPDATE: (id: string) => `/orders/${id}`,
  ORDERS_CANCEL: (id: string) => `/orders/${id}/cancel`,
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  CONFLICT: 'Resource already exists',
};
