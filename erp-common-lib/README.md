# Common Library

Shared utilities, types, and constants for ERP Platform.

## Installation

```bash
npm install @erp-platform/common-lib
```

## Usage

```typescript
import {
  IUser,
  IProduct,
  API_ENDPOINTS,
  formatDate,
  generateId,
} from '@erp-platform/common-lib';

// Use types
const user: IUser = {
  id: generateId(),
  email: 'user@example.com',
  name: 'John Doe',
  role: 'user',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Use constants
const endpoint = API_ENDPOINTS.USERS_GET(user.id);

// Use utilities
const formatted = formatDate(new Date());
```

## Contents

- `types.ts` - TypeScript interfaces and enums
- `constants.ts` - API endpoints, HTTP status codes, error messages
- `utils.ts` - Helper functions

## License

MIT
