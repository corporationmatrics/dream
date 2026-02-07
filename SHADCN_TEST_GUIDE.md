# Quick Test Guide - shadcn/ui Integration

## Testing the Integration

### 1. Start Development Server
Already running on **http://localhost:3000**

### 2. Test Login Page
Navigate to: **http://localhost:3000/auth/login**

**What to verify:**
- ✅ Page loads without errors
- ✅ shadcn Card component displays
- ✅ Login form with Input components
- ✅ Alert for error messages
- ✅ Responsive design works
- ✅ Demo credentials are visible

**Test Demo Credentials:**
- Email: `john@example.com`
- Password: `password123`

### 3. Test Dashboard
Navigate to: **http://localhost:3000/dashboard**

**What to verify:**
- ✅ StatCard components display
- ✅ Tabs navigation works
- ✅ Table renders with sample data
- ✅ Badges show status colors
- ✅ Buttons are interactive
- ✅ Responsive grid layout

**Interactive Elements:**
- Click tabs: "Recent Orders", "Products", "Activity"
- Click "Create Order", "Manage Products" buttons
- Check responsive: Resize browser window

### 4. Test Profile Page
Navigate to: **http://localhost:3000/profile**

**What to verify:**
- ✅ User avatar displays
- ✅ Tabbed interface works
- ✅ Account information displays
- ✅ Quick links are functional
- ✅ Sign Out button works
- ✅ Responsive on mobile

**Tab Testing:**
- Click "Account" tab
- Click "Security" tab
- Click "Preferences" tab

### 5. Component Quality Checks

#### Colors & Styling
- [ ] Neutral color theme applied
- [ ] Text contrast readable (WCAG AA)
- [ ] Spacing is consistent
- [ ] Shadows and borders look good

#### Responsiveness
- [ ] Mobile (320px width)
- [ ] Tablet (768px width)
- [ ] Desktop (1200px+ width)

#### Interactions
- [ ] Buttons hover correctly
- [ ] Forms focus properly
- [ ] Tabs switch smoothly
- [ ] No console errors

### 6. Browser Console Verification

Open DevTools (F12) and check:
```
✅ No errors in console
✅ No warnings about missing components
✅ CSS loads properly
✅ Images/icons load
```

### 7. Sample API Calls (if backend is running)

If erp-api is running on port 3002:

```bash
# Get auth status
curl http://localhost:3002/api/health

# Get products (with auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3002/products

# Get orders (with auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3002/api/orders
```

---

## Page-by-Page Testing Details

### Login Page (`/auth/login`)
```
┌─────────────────────────────────┐
│     ERP Platform                │
│  Enterprise Resource Planning   │
├─────────────────────────────────┤
│  ┌─────────────────────────────┐│
│  │ Sign In                     ││
│  │ Enter credentials           ││
│  ├─────────────────────────────┤│
│  │ Email: [____________]       ││
│  │ Password: [____________]    ││
│  │ Forgot password?            ││
│  │ [Sign In Button]            ││
│  │                             ││
│  │ Demo: john@example.com      ││
│  │ Password: password123       ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

### Dashboard (`/dashboard`)
```
┌──────────────────────────────────────┐
│ ERP Platform        Dashboard │ Logout│
├──────────────────────────────────────┤
│ Welcome back, User!                  │
│ Here's what happening in your biz... │
├──────────────────────────────────────┤
│ [Total Orders] [Pending] [Revenue]   │
│ [Active Products]                    │
├──────────────────────────────────────┤
│ ⚠️ Pending Orders Alert               │
├──────────────────────────────────────┤
│ Tabs: Recent Orders | Products | ...│
│ ├─ [Table with Orders Data]         │
│ ├─ [Badges for Status]              │
│ └─ [View Buttons]                   │
├──────────────────────────────────────┤
│ Quick Actions:                      │
│ [Create Order] [View Products] ...  │
└──────────────────────────────────────┘
```

### Profile Page (`/profile`)
```
┌──────────────────────────────────────┐
│ My Profile                   [Back] │
├──────────────────────────────────────┤
│ [Avatar] User Name                   │
│         user@example.com             │
│         [Active] [admin]             │
│                          [Edit Profile]
├──────────────────────────────────────┤
│ Tabs: Account | Security | Preferences
│ ├─ [Account Details Grid]           │
│ ├─ [Security Options]               │
│ └─ [Preferences]                    │
├──────────────────────────────────────┤
│ Quick Links:                        │
│ [Orders] [Products] [Dashboard]     │
├──────────────────────────────────────┤
│ DANGER ZONE:                        │
│ [Sign Out] [Delete Account]         │
└──────────────────────────────────────┘
```

---

## Common Issues & Troubleshooting

### Issue: Page doesn't load
**Solution:**
```bash
# Check if dev server is running
netstat -ano | findstr :3000

# Restart dev server
npm run dev
```

### Issue: shadcn components not styled
**Solution:**
```bash
# Rebuild Tailwind CSS
npm run dev  # Should rebuild automatically

# Check if globals.css is valid
cat src/app/globals.css
```

### Issue: Missing components
**Solution:**
```bash
# Add missing component
npx shadcn@latest add <component-name>

# Example
npx shadcn@latest add progress
npx shadcn@latest add accordion
```

### Issue: Authentication not working
**Solution:**
- This is expected for now
- Keycloak integration is next step
- Demo credentials shown on login form
- Follow KEYCLOAK_SETUP.md

---

## Performance Testing

### Load Time
```bash
# From Chrome DevTools Network tab
Target: < 3 seconds initial load
Target: < 500ms route navigation
```

### Bundle Size
```bash
npm run build
# Check output in .next/static
```

### Accessibility Score
```
Target: Lighthouse score > 90
- Accessibility: 95+
- Performance: 85+
- Best Practices: 90+
```

---

## Before Moving to Next Phase

Verify all these work:
- [ ] Dev server runs without errors
- [ ] All 3 pages load correctly
- [ ] Components render properly
- [ ] No console errors
- [ ] Responsive design works
- [ ] Navigation between pages works
- [ ] Buttons and forms respond to input
- [ ] shadcn styling applied correctly

---

## Next Steps After Testing

If all tests pass:
1. ✅ shadcn/ui integration complete
2. 👉 Move to **Keycloak Integration** (KEYCLOAK_SETUP.md)
3. Then: MongoDB for telemetry
4. Then: OCR document processing
5. Then: Phase 2 tools

---

## Commands Quick Reference

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm start               # Run production build
npm run lint            # Check code quality

# Testing
npm run test            # Run tests
npm run test:watch      # Watch mode
npm run test:cov        # Coverage report

# Maintenance
npm run format          # Format code (Prettier)
npm install             # Install dependencies
npm update              # Update packages
npm audit              # Check vulnerabilities

# shadcn commands
npx shadcn@latest add <name>        # Add component
npx shadcn@latest list              # List available
npx shadcn@latest init --yes        # Reinitialize
```

---

## Success Criteria ✅

Your integration is successful when:
1. ✅ Dev server runs without errors
2. ✅ Login page renders with shadcn components
3. ✅ Dashboard displays stats and tables
4. ✅ Profile page shows user info in tabs
5. ✅ No console errors or warnings
6. ✅ All interactive elements work
7. ✅ Responsive on mobile, tablet, desktop
8. ✅ Can navigate between pages

---

**Last Updated:** February 6, 2026
**Status:** Phase 1 UI Framework Integration Complete ✅
