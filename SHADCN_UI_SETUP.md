# shadcn/ui Integration Guide
# Professional React Component Library for ERP Platform

## Overview

**shadcn/ui** provides:
- Accessible, high-quality React components
- Built on Radix UI primitives
- Tailwind CSS styling
- TypeScript support
- Copy-paste friendly (not npm module)
- Licensed under MIT

**Perfect for your stack:**
- ✅ Already using Next.js + React hooks
- ✅ Tailwind CSS configured
- ✅ TypeScript in use
- ✅ Zod validation patterns

---

## Installation

### Step 1: Initialize shadcn/ui

```bash
cd erp-web

# Initialize shadcn/ui
npx shadcn-ui@latest init

# Follow prompts:
# ✔ Which style would you like to use? › Default
# ✔ Which color would you like as the base color? › Slate
# ✔ Do you want to use CSS variables for theming? › yes
# ✔ Which file would you like to update for TypeScript paths? › ./tsconfig.json
```

### Step 2: Project Structure

After initialization, you'll have:

```
erp-web/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx        (from shadcn)
│   │   │   ├── input.tsx         (from shadcn)
│   │   │   ├── card.tsx          (from shadcn)
│   │   │   ├── dialog.tsx        (from shadcn)
│   │   │   └── ...
│   │   └── custom/               (your components)
│   │       ├── Navbar.tsx
│   │       ├── Dashboard.tsx
│   │       └── ...
│   ├── lib/
│   │   └── utils.ts              (cn() utility)
│   └── app/
├── components.json               (shadcn config)
└── tsconfig.json
```

---

## Essential Components to Add

### 1. Install Core Components

```bash
cd erp-web

# Basic form elements
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add radio-group
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea

# Layout
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add accordion

# Dialogs & Modals
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add alert-dialog
npx shadcn-ui@latest add sheet

# Feedback
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add progress

# Navigation
npx shadcn-ui@latest add breadcrumb
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add navigation-menu

# Advanced
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add command
npx shadcn-ui@latest add combobox
npx shadcn-ui@latest add date-picker
```

---

## Usage Examples

### Button Variants

File: `src/components/custom/ActionButtons.tsx`

```typescript
'use client';

import { Button } from '@/components/ui/button';

export function ActionButtons() {
  return (
    <div className="flex gap-2">
      <Button variant="default">Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button disabled>Disabled</Button>
      <Button size="lg">Large</Button>
      <Button size="sm">Small</Button>
    </div>
  );
}
```

### Form Component

File: `src/components/custom/ProductForm.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface ProductFormProps {
  onSubmit: (data: any) => void;
}

export function ProductForm({ onSubmit }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    quantity: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Add New Product</CardTitle>
        <CardDescription>Fill in the product details below</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              placeholder="e.g., Widget A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                placeholder="e.g., WID-001"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Product description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <Button type="submit" className="w-full">
            Add Product
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Data Table Component

File: `src/components/custom/OrdersTable.tsx`

```typescript
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Order {
  id: string;
  customerName: string;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  date: string;
}

interface OrdersTableProps {
  orders: Order[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono text-sm">{order.id}</TableCell>
              <TableCell>{order.customerName}</TableCell>
              <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
              <TableCell className="font-semibold">${order.total.toFixed(2)}</TableCell>
              <TableCell>
                <Badge className={statusColor[order.status]}>
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### Dialog Component

File: `src/components/custom/ConfirmDialog.tsx`

```typescript
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel?: () => void;
  isOpen: boolean;
  isLoading?: boolean;
}

export function ConfirmDialog({
  title,
  description,
  onConfirm,
  onCancel,
  isOpen,
  isLoading,
}: ConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel?.()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Toast Notifications

File: `src/components/custom/useToast.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Toast, ToastAction } from '@/components/ui/toast';
import { Toaster } from '@/components/ui/toaster';

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToastNotification() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...message, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return {
    addToast,
    success: (title: string, description?: string) =>
      addToast({ title, description, variant: 'default' }),
    error: (title: string, description?: string) =>
      addToast({ title, description, variant: 'destructive' }),
  };
}
```

### Navigation Menu

File: `src/components/custom/Navbar.tsx`

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu } from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl">
          ERP Platform
        </Link>

        <div className="hidden md:flex gap-4">
          <Link href="/products">
            <Button variant="ghost">Products</Button>
          </Link>
          <Link href="/orders">
            <Button variant="ghost">Orders</Button>
          </Link>
          <Link href="/customers">
            <Button variant="ghost">Customers</Button>
          </Link>
        </div>

        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Link href="/products">Products</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/orders">Orders</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/customers">Customers</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
```

---

## Theme Customization

### CSS Variables (Dark/Light Mode)

File: `src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.6%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.6%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.6%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 9.1%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --primary: 0 0% 9.1%;
    --primary-foreground: 0 0% 98%;
    --ring: 0 0% 3.6%;
  }

  .dark {
    --background: 0 0% 3.6%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.6%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.6%;
    --popover-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 98%;
    --accent-foreground: 0 0% 9.1%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9.1%;
    --ring: 0 0% 83.3%;
  }
}

body {
  color: hsl(var(--foreground));
  background-color: hsl(var(--background));
  transition: background-color 0.35s ease-in-out, color 0.35s ease-in-out;
}
```

### Theme Switcher

File: `src/components/custom/ThemeSwitcher.tsx`

```typescript
'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
```

---

## Icons (Lucide React)

shadcn components come with Lucide icons:

```typescript
import {
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit,
  Plus,
  Search,
} from 'lucide-react';
```

---

## Form Validation with Zod

File: `src/components/custom/LoginForm.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log('Login:', data);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>Enter your credentials</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

---

## Performance Tips

1. **Use `<Suspense>`** for code splitting
2. **Lazy load components** with `React.lazy()`
3. **Memoize with `useMemo`** for expensive operations
4. **Keep component tree shallow** for better re-render performance
5. **Use shadcn components as-is** (copy-paste means you control the code)

---

## Package.json Updates

```json
{
  "dependencies": {
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "@radix-ui/react-slot": "^2.0.2",
    "@radix-ui/react-dropdown-menu": "^2.0.3",
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-popover": "^1.0.6",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "lucide-react": "^0.263.1",
    "react-hook-form": "^7.48.0",
    "@hookform/resolvers": "^3.3.2",
    "zod": "^3.22.0",
    "next-themes": "^0.2.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4",
    "typescript": "^5",
    "@types/react": "^19"
  }
}
```

---

## Testing Components

File: `src/components/ui/button.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    screen.getByText('Click').click();
    expect(handleClick).toHaveBeenCalled();
  });

  it('shows disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });
});
```

---

## Common Patterns

### Loading State
```typescript
<Button disabled={isLoading}>
  {isLoading ? 'Loading...' : 'Submit'}
</Button>
```

### Conditional Classes
```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  'base-class',
  isActive && 'active-class',
  isError && 'error-class'
)}>
  Content
</div>
```

### Responsive Design
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* responsive grid */}
</div>
```

---

## Resources

- **Docs:** https://ui.shadcn.com/docs
- **Components:** https://ui.shadcn.com/docs/components
- **Radix UI:** https://www.radix-ui.com/
- **Tailwind CSS:** https://tailwindcss.com/

---

## Next Steps

1. ✅ Run `npx shadcn-ui@latest init`
2. ✅ Install core components
3. ✅ Replace existing components with shadcn versions
4. ✅ Customize theme colors
5. ✅ Set up dark mode
6. ✅ Create component library in Storybook
7. ✅ Add component tests

