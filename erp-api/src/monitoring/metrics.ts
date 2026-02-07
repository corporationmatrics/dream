import { Counter, Histogram, Gauge, Registry } from 'prom-client';

// Create a new registry for our metrics
export const register = new Registry();

// ============================================
// HTTP Request Metrics
// ============================================
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// ============================================
// Business Metrics - Credit Ledger
// ============================================
export const creditRequestsTotal = new Counter({
  name: 'credit_requests_total',
  help: 'Total credit requests by status',
  labelNames: ['retailer_id', 'status', 'reason'],
  registers: [register],
});

export const creditLimitUtilization = new Gauge({
  name: 'credit_limit_utilization_percent',
  help: 'Credit limit utilization percentage',
  labelNames: ['customer_id', 'retailer_id'],
  registers: [register],
});

export const creditDefaults = new Counter({
  name: 'credit_defaults_total',
  help: 'Total credit defaults',
  labelNames: ['customer_id', 'retailer_id', 'reason'],
  registers: [register],
});

export const creditRepaymentDaysOverdue = new Gauge({
  name: 'credit_repayment_days_overdue',
  help: 'Days overdue for credit repayment',
  labelNames: ['customer_id'],
  registers: [register],
});

// ============================================
// Business Metrics - Payments
// ============================================
export const paymentProcessingTime = new Histogram({
  name: 'payment_processing_duration_seconds',
  help: 'Payment processing time in seconds',
  labelNames: ['method', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const failedPayments = new Counter({
  name: 'failed_payments_total',
  help: 'Total failed payment attempts',
  labelNames: ['method', 'reason'],
  registers: [register],
});

export const successfulPayments = new Counter({
  name: 'successful_payments_total',
  help: 'Total successful payments',
  labelNames: ['method'],
  registers: [register],
});

export const paymentAmountProcessed = new Counter({
  name: 'payment_amount_processed_total',
  help: 'Total payment amount processed in rupees',
  labelNames: ['method', 'status'],
  registers: [register],
});

// ============================================
// Business Metrics - Orders
// ============================================
export const ordersCreatedTotal = new Counter({
  name: 'orders_created_total',
  help: 'Total orders created',
  labelNames: ['retailer_segment', 'status'],
  registers: [register],
});

export const ordersValueTotal = new Counter({
  name: 'orders_value_total',
  help: 'Total order value in rupees',
  labelNames: ['retailer_segment'],
  registers: [register],
});

export const ordersProcessingTime = new Histogram({
  name: 'orders_processing_duration_seconds',
  help: 'Order processing time from creation to fulfillment',
  labelNames: ['order_type'],
  buckets: [60, 300, 600, 1800, 3600],
  registers: [register],
});

// ============================================
// Business Metrics - Products
// ============================================
export const productsSearched = new Counter({
  name: 'products_searched_total',
  help: 'Total product searches',
  labelNames: ['category', 'search_type'],
  registers: [register],
});

export const productViewsTotal = new Counter({
  name: 'product_views_total',
  help: 'Total product page views',
  labelNames: ['product_id', 'category'],
  registers: [register],
});

export const inventoryLevel = new Gauge({
  name: 'inventory_level_units',
  help: 'Current inventory level in units',
  labelNames: ['product_id', 'warehouse_id'],
  registers: [register],
});

export const stockouts = new Counter({
  name: 'stockouts_total',
  help: 'Total stockout events',
  labelNames: ['product_id', 'category'],
  registers: [register],
});

// ============================================
// Business Metrics - Logistics
// ============================================
export const deliveryCompleted = new Counter({
  name: 'deliveries_completed_total',
  help: 'Total completed deliveries',
  labelNames: ['status', 'zone'],
  registers: [register],
});

export const deliveryTimeVsEta = new Histogram({
  name: 'delivery_time_vs_eta_minutes',
  help: 'Difference between actual and estimated delivery time',
  labelNames: ['route_type', 'zone'],
  buckets: [-60, -30, -15, 0, 15, 30, 60, 120],
  registers: [register],
});

export const deliverySlaViolations = new Counter({
  name: 'delivery_sla_violations_total',
  help: 'Total delivery SLA violations',
  labelNames: ['zone', 'reason'],
  registers: [register],
});

export const vehicleUtilization = new Gauge({
  name: 'vehicle_utilization_percent',
  help: 'Vehicle capacity utilization percentage',
  labelNames: ['vehicle_id', 'vehicle_type'],
  registers: [register],
});

export const routeOptimizationSavings = new Gauge({
  name: 'route_optimization_savings_percent',
  help: 'Cost savings from route optimization',
  labelNames: ['optimization_type'],
  registers: [register],
});

// ============================================
// Database Metrics
// ============================================
export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Database query latency in seconds',
  labelNames: ['query_type', 'table', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

export const databaseConnections = new Gauge({
  name: 'database_connections',
  help: 'Number of active database connections',
  labelNames: ['pool'],
  registers: [register],
});

export const databaseErrors = new Counter({
  name: 'database_errors_total',
  help: 'Total database errors',
  labelNames: ['error_type'],
  registers: [register],
});

// ============================================
// Cache Metrics
// ============================================
export const cacheHitRate = new Gauge({
  name: 'cache_hit_rate_percent',
  help: 'Cache hit rate percentage',
  labelNames: ['cache_type'],
  registers: [register],
});

export const cacheEvictions = new Counter({
  name: 'cache_evictions_total',
  help: 'Total cache evictions',
  labelNames: ['cache_type', 'reason'],
  registers: [register],
});

// ============================================
// System Metrics
// ============================================
export const activeUsers = new Gauge({
  name: 'active_users_count',
  help: 'Number of active users',
  labelNames: ['user_type'],
  registers: [register],
});

export const sessionDuration = new Histogram({
  name: 'session_duration_seconds',
  help: 'User session duration in seconds',
  labelNames: ['user_type'],
  buckets: [60, 300, 600, 1800, 3600, 7200],
  registers: [register],
});

export const errorCount = new Counter({
  name: 'errors_total',
  help: 'Total application errors',
  labelNames: ['error_type', 'severity'],
  registers: [register],
});

// ============================================
// Feature Usage Metrics
// ============================================
export const featureUsage = new Counter({
  name: 'feature_usage_total',
  help: 'Total feature usage count',
  labelNames: ['feature_name', 'user_type'],
  registers: [register],
});

export const auctionBids = new Counter({
  name: 'auction_bids_total',
  help: 'Total auction bids placed',
  labelNames: ['product_category', 'bid_status'],
  registers: [register],
});

export const wishlistAdds = new Counter({
  name: 'wishlist_adds_total',
  help: 'Total items added to wishlist',
  labelNames: ['product_category'],
  registers: [register],
});

// ============================================
// Export register for controller
// ============================================
export default register;
