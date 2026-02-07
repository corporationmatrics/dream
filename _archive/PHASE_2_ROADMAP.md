# PHASE 2: Web Dashboard & Frontend Development
**Target**: 2026-02-04 to 2026-02-18 | **Duration**: 2 weeks | **Priority**: HIGH

---

## 🎯 PHASE 2 OBJECTIVES

### Primary Goals
1. ✅ **Build Web Dashboard** - React components for user interface
2. ✅ **Create Authentication Flow** - Login/register UI
3. ✅ **Product Management UI** - List, search, detail pages
4. ✅ **Order Management UI** - Create, view, track orders
5. ✅ **Admin Panel** - Manage products and orders

### Success Criteria
- [ ] All pages responsive (mobile-friendly)
- [ ] All API endpoints integrated
- [ ] Full authentication flow working
- [ ] No console errors
- [ ] Load times < 3 seconds per page

---

## 📋 DETAILED REQUIREMENTS

### 1. AUTHENTICATION PAGES

#### A. Login Page
**Location**: `/login` or `/`

**Components**:
- Email input field
- Password input field
- "Login" button
- "Register" link
- Password reset link
- Error message display
- Loading state during login

**Functionality**:
- Form validation (email format, required fields)
- API call to POST /auth/login
- Store JWT token in localStorage/cookies
- Redirect to dashboard on success
- Display error messages on failure

**Design**:
- Professional login form
- Company logo/branding
- Clean, minimal layout
- Mobile responsive

**Tech Stack**:
- React Hook Form (form handling)
- Zod (validation)
- TailwindCSS (styling)

---

#### B. Register Page
**Location**: `/register`

**Components**:
- Email input
- Password input
- Confirm password input
- First name input
- Last name input
- Terms checkbox
- "Register" button
- Login link

**Functionality**:
- Form validation
- Password strength indicator
- Password confirmation
- API call to POST /auth/register
- Auto-login after registration
- Redirect to dashboard

**Design**:
- Consistent with login page
- Clear password requirements
- Success message

---

#### C. Protected Route Wrapper
**Components**:
- ProtectedRoute component
- Redirect to login if no token
- Token expiration handling
- Refresh token logic (if implemented)

**Functionality**:
- Check localStorage for JWT
- Verify token validity
- Protect all admin/user pages

---

### 2. DASHBOARD PAGES

#### A. Main Dashboard
**Location**: `/dashboard` (default after login)

**Layout**:
- Header with user profile & logout
- Left sidebar with navigation
- Main content area
- Footer (optional)

**Sections**:
1. **Welcome Section**
   - "Welcome back, [First Name]!"
   - Current date/time
   - Quick stats cards

2. **Key Metrics Cards**
   - Total products in stock
   - Orders this month
   - Revenue this month
   - Pending orders
   - Total customers

3. **Charts & Graphs**
   - Sales trend (last 30 days)
   - Top products
   - Order status breakdown
   - Revenue by category

4. **Recent Activity**
   - Last 5 orders
   - Low stock alerts
   - Recent user activity

5. **Quick Actions**
   - Create new order
   - Add new product
   - View reports
   - Manage inventory

**Tech Stack**:
- Recharts or Chart.js (charts)
- React Grid/Layout

---

#### B. Navigation/Sidebar
**Items**:
- Dashboard (home icon)
- Products (shopping icon)
- Orders (package icon)
- Accounting (calculator icon)
- Reports (chart icon)
- Settings (gear icon)
- Logout

**Features**:
- Active state highlighting
- Icon + label
- Collapse on mobile
- Dark/light theme toggle (optional)

---

### 3. PRODUCT MANAGEMENT UI

#### A. Products List Page
**Location**: `/products`

**Features**:
1. **Product Table/Grid**
   - Columns: Product Name, SKU, Price, Stock, Category, Status, Actions
   - Sortable columns
   - Pagination (10-20 items per page)
   - Row selection (bulk actions)

2. **Search & Filter**
   - Search by product name/SKU
   - Filter by category
   - Filter by status (active/inactive)
   - Filter by price range

3. **Action Buttons**
   - "Add Product" button
   - Edit button (per row)
   - Delete button (per row)
   - View details (per row)

4. **Bulk Actions**
   - Delete multiple
   - Change status
   - Export to CSV

5. **Display Options**
   - List view (default)
   - Grid view
   - Items per page selector

**Tech Stack**:
- React Table or DataGrid
- React Icons for buttons
- React Toastify for notifications

---

#### B. Product Detail Page
**Location**: `/products/:id`

**Sections**:
1. **Product Information**
   - Product name
   - Description
   - Images carousel
   - Category
   - Status

2. **Pricing & Inventory**
   - Unit price
   - Cost price
   - Stock quantity
   - Stock status (In Stock/Low Stock/Out of Stock)
   - Warehouse location

3. **Metadata**
   - SKU
   - Barcode
   - Created date
   - Last updated
   - Created by

4. **Actions**
   - Edit button
   - Delete button
   - Print label button
   - Related products

---

#### C. Add/Edit Product Modal
**Location**: Modal overlay on products page

**Form Fields**:
- Product name (required, max 100 chars)
- Description (rich text editor, optional)
- SKU (required, unique)
- Category (dropdown)
- Price (required, decimal)
- Cost price (optional)
- Stock quantity (required, integer)
- Status (active/inactive)
- Images (upload multiple)

**Features**:
- Form validation
- Image preview
- Save draft
- Cancel changes
- Success notification

**Tech Stack**:
- React Hook Form
- Image upload library
- Rich text editor (optional)

---

### 4. ORDER MANAGEMENT UI

#### A. Orders List Page
**Location**: `/orders`

**Features**:
1. **Order Table**
   - Columns: Order #, Date, Customer, Items, Total, Status, Actions
   - Sortable, filterable, paginated
   - Order status color coding

2. **Search & Filter**
   - Search by order number/customer
   - Filter by status (pending, confirmed, shipped, delivered, cancelled)
   - Filter by date range
   - Filter by price range

3. **Action Buttons**
   - Create order button
   - View details (per row)
   - Update status (per row)
   - Cancel order (per row)
   - Print invoice (per row)

4. **Status Indicators**
   - Pending (yellow)
   - Confirmed (blue)
   - Shipped (purple)
   - Delivered (green)
   - Cancelled (red)

---

#### B. Order Detail Page
**Location**: `/orders/:id`

**Sections**:
1. **Order Header**
   - Order number
   - Order date
   - Customer name
   - Status badge
   - Last updated

2. **Customer Information**
   - Name, email, phone
   - Shipping address
   - Billing address

3. **Order Items Table**
   - Product name, SKU
   - Unit price, quantity
   - Line total
   - Remove item button (if pending)

4. **Order Totals**
   - Subtotal
   - Tax amount
   - Shipping (if applicable)
   - Discount (if applicable)
   - Total amount

5. **Timeline/Activity**
   - Order created
   - Confirmed
   - Shipped
   - Delivered
   - Status change history

6. **Actions**
   - Update status dropdown
   - Add note/comment
   - Cancel order button
   - Print invoice button
   - Email receipt button

---

#### C. Create Order Page
**Location**: `/orders/new`

**Workflow**:
1. **Step 1: Select Customer**
   - Search existing customers
   - Or create new customer inline

2. **Step 2: Add Products**
   - Search/browse products
   - Select product
   - Enter quantity
   - Add to cart
   - Remove from cart
   - Update quantity

3. **Step 3: Review & Confirm**
   - Review items
   - Apply discount (if admin)
   - Confirm total
   - Create order button

**Features**:
- Stock validation
- Real-time total calculation
- Auto-apply tax (10%)
- Save as draft
- Clear cart

---

### 5. ADMIN FEATURES

#### A. Admin Dashboard
**Additional Metrics**:
- Total revenue
- Total customers
- Avg order value
- Inventory value
- Conversion rate

#### B. User Management (Optional for Phase 2)
- List all users
- Edit user roles
- Deactivate users
- View user activity

#### C. Settings Page
- Company information
- Tax rates
- Shipping settings
- Email templates
- API keys

---

## 🎨 UI/UX DESIGN SYSTEM

### Layout Components
```
Header
├── Logo
├── Search bar
├── User menu
└── Notification bell

Sidebar
├── Navigation links
├── User profile
└── Collapse button

Main Content
├── Page title
├── Breadcrumbs
├── Content area
└── Footer
```

### Color Scheme
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Danger: Red (#EF4444)
- Background: Light gray (#F3F4F6)
- Text: Dark gray (#1F2937)

### Typography
- Heading 1: 32px, bold
- Heading 2: 24px, semibold
- Body: 14-16px, regular
- Small: 12px, regular

### Button Variants
- Primary (solid blue)
- Secondary (outline)
- Success (solid green)
- Danger (solid red)
- Ghost (transparent)

---

## 📁 PROJECT STRUCTURE

```
erp-web/src/app/
├── layout.tsx                    # Root layout with header/sidebar
├── page.tsx                      # Home/redirect
├── auth/
│   ├── login/page.tsx            # Login page
│   ├── register/page.tsx         # Register page
│   ├── AuthContext.tsx           # Auth state management
│   └── ProtectedRoute.tsx        # Route protection
├── dashboard/
│   ├── page.tsx                  # Main dashboard
│   └── components/
│       ├── MetricsCard.tsx
│       ├── SalesChart.tsx
│       └── RecentOrders.tsx
├── products/
│   ├── page.tsx                  # Products list
│   ├── [id]/page.tsx            # Product detail
│   ├── new/page.tsx             # Add product
│   └── components/
│       ├── ProductTable.tsx
│       ├── ProductForm.tsx
│       └── ProductFilters.tsx
├── orders/
│   ├── page.tsx                 # Orders list
│   ├── [id]/page.tsx            # Order detail
│   ├── new/page.tsx             # Create order
│   └── components/
│       ├── OrderTable.tsx
│       ├── OrderForm.tsx
│       └── OrderTimeline.tsx
└── components/
    ├── Navigation/
    ├── Header.tsx
    └── Sidebar.tsx
```

---

## 🔗 API INTEGRATION POINTS

### Login Flow
```
User Input
    ↓
POST /auth/login
    ↓
Store JWT Token
    ↓
Redirect to Dashboard
```

### Product Management Flow
```
GET /products (list)
    ↓
GET /products/:id (detail)
    ↓
POST /products (create)
    ↓
PUT /products/:id (update)
    ↓
PUT /products/:id/stock (inventory)
```

### Order Management Flow
```
GET /orders (list)
    ↓
GET /orders/:id (detail)
    ↓
POST /orders (create)
    ↓
PUT /orders/:id/status (update status)
    ↓
PUT /orders/:id/cancel (cancel)
```

---

## 📦 DEPENDENCIES TO ADD

```bash
npm install \
  react-hook-form \
  zod @hookform/resolvers \
  recharts \
  react-icons \
  react-table \
  react-toastify \
  axios \
  date-fns \
  clsx classnames
```

---

## 🧪 TESTING APPROACH

### User Flow Testing
1. Register new user
2. Login with credentials
3. View dashboard
4. Create product
5. List products
6. Create order
7. View order details
8. Update order status

### Component Testing
- Form validation
- API error handling
- Loading states
- Empty states
- Edge cases

---

## 📊 IMPLEMENTATION TIMELINE

### Week 1 (Days 1-5)
- **Day 1**: Auth pages (login, register) - 4 hours
- **Day 2**: Protected routes & context - 2 hours
- **Day 3**: Dashboard layout & metrics - 4 hours
- **Day 4**: Products list & filtering - 4 hours
- **Day 5**: Product detail & forms - 4 hours

**Subtotal**: ~18 hours

### Week 2 (Days 6-10)
- **Day 6**: Orders list & filtering - 4 hours
- **Day 7**: Order detail & timeline - 4 hours
- **Day 8**: Create order workflow - 4 hours
- **Day 9**: Charts & analytics - 3 hours
- **Day 10**: Testing, fixes, polish - 4 hours

**Subtotal**: ~19 hours

**Total Phase 2**: ~37 hours (5-6 days of full-time work)

---

## ✅ ACCEPTANCE CRITERIA

### Functionality
- [ ] All pages load correctly
- [ ] All forms submit successfully
- [ ] All API calls work
- [ ] Error handling in place
- [ ] Loading states display
- [ ] Success messages show

### User Experience
- [ ] Responsive design works on mobile
- [ ] Navigation is intuitive
- [ ] Buttons are clickable and functional
- [ ] Forms are easy to fill
- [ ] Data displays correctly

### Performance
- [ ] Pages load in < 3 seconds
- [ ] API calls complete in < 2 seconds
- [ ] No unnecessary re-renders
- [ ] Images optimized

### Quality
- [ ] No console errors
- [ ] No broken links
- [ ] Clean, readable code
- [ ] Proper error messages
- [ ] Consistent styling

---

## 🎯 DELIVERABLES

### By End of Phase 2
1. **Fully functional web dashboard** with all CRUD operations
2. **Authentication system** with login/register UI
3. **Product management** with list, detail, and form pages
4. **Order management** with list, detail, and create workflow
5. **Responsive design** working on all device sizes
6. **Integration** with all Phase 1 API endpoints
7. **Documentation** for frontend components and pages

---

## 🚀 SUCCESS DEFINITION

Phase 2 is complete when:
- ✅ All pages render without errors
- ✅ All API endpoints are integrated
- ✅ User can perform full workflows (login → product search → create order)
- ✅ UI is responsive and user-friendly
- ✅ No critical bugs
- ✅ Code is well-organized and documented

---

## 📝 NOTES

### Development Notes
- Use Next.js App Router (already in place)
- TailwindCSS for styling (already installed)
- React Hook Form for complex forms
- Store JWT in localStorage (with secure httpOnly consideration)
- Implement token refresh logic
- Add loading skeletons for better UX
- Use proper error boundaries

### Best Practices
- Component reusability
- Proper TypeScript types
- Error handling at every API call
- Loading and empty states
- Proper accessibility (ARIA labels)
- Mobile-first responsive design

---

**Ready to Start Phase 2!** 🚀
