# 🛠️ Tech Stack & Coding Rules

## 1. Supabase Client — Strict Rules

### Server Side (Route Handlers & Server Components)
```ts
// ✅ CORRECT
import { createServerClient } from '@/lib/supabase/server';
const supabase = await createServerClient(); // ASYNC — always await

// ❌ WRONG — deprecated wrapper
import { createSupabaseServerClient } from '@/lib/api/supabase-server';

// ❌ WRONG — deprecated single file
import { supabase } from '@/lib/supabase';
```

### Client Side (Client Components only)
```ts
// ✅ CORRECT — function (creates fresh instance)
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();

// ✅ CORRECT — singleton (use in hooks)
import { supabase } from '@/lib/supabase/client';
```

### Admin Operations (bypasses RLS — use with caution)
```ts
// ✅ Only for admin/staff server-side operations
import { createSupabaseAdminClient } from '@/lib/api/supabase-server';
const supabase = await createSupabaseAdminClient(); // Requires SUPABASE_SERVICE_ROLE_KEY
```

---

## 2. TypeScript Rules

- **No `any`** — use types from `src/types/database.ts`
- **No hardcoded table name strings** — always use `TABLES`:
  ```ts
  import { TABLES } from '@/lib/db/schema';
  supabase.from(TABLES.travelRequests)  // ✅
  supabase.from('travel_requests')       // ❌
  ```
- **Supabase row types**: use `Database['public']['Tables']['table_name']['Row']`
- **Always handle Supabase errors**:
  ```ts
  const { data, error } = await supabase.from(TABLES.profiles).select('*');
  if (error) throw new AppError(error.message, 500);
  ```

---

## 3. API Response Standard — Mandatory

**Always** use helpers from `src/lib/api/response.ts`:

```ts
import {
  successResponse,      // 200 OK
  createdResponse,      // 201 Created
  noContentResponse,    // 204 No Content
  errorResponse,        // auto status from AppError
  validationErrorResponse, // 400
  unauthorizedResponse,    // 401
  forbiddenResponse,       // 403
  notFoundResponse,        // 404
} from '@/lib/api/response';

// ❌ AVOID — duplicate, inconsistent signature in server-utils.ts
// import { successResponse, errorResponse } from '@/lib/api/server-utils';
```

**Standard Route Handler pattern:**
```ts
import { createServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/api/server-utils';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api/response';
import { AppError } from '@/lib/api/errors';
import { TABLES } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const user = await requireUser(supabase);

    const { data, error } = await supabase.from(TABLES.profiles).select('*').eq('user_id', user.id).single();
    if (error || !data) return notFoundResponse('Profile');

    return successResponse(data);
  } catch (err) {
    return errorResponse(err as Error);
  }
}
```

---

## 4. Auth Guards — from `server-utils.ts` (valid use)

```ts
import {
  requireUser,             // throws if not authenticated
  requireStaff,            // throws if not staff/admin
  requireOwnerOrStaff,     // throws if not owner or staff
  requireCompleteProfile,  // throws if profile incomplete
} from '@/lib/api/server-utils';

// All accept the supabase client as parameter:
const supabase = await createServerClient();
const user = await requireUser(supabase);
```

---

## 5. RPC Functions — Rules

- Use RPCs for all **transactional** operations (booking, cancel, confirm, expire)
- RPCs always return `{ ok: boolean, code?: string, message?: string, data?: unknown }`
- **Always check `result.ok`** before using `result.data`
- On failure → call `handleRPCError(result)` which throws a typed `AppError`:

```ts
import { handleRPCError } from '@/lib/api/errors';

const { data: result, error } = await supabase.rpc('book_flight', { ... });
if (error) throw new AppError(error.message, 500);
if (!result.ok) handleRPCError(result); // throws — never returns
return successResponse(result.data);
```

---

## 6. Error Classes (from `src/lib/api/errors.ts`)

| Class | HTTP | Code |
|-------|------|------|
| `ValidationError` | 400 | `VALIDATION_ERROR` |
| `AuthenticationError` | 401 | `AUTHENTICATION_ERROR` |
| `AuthorizationError` | 403 | `AUTHORIZATION_ERROR` |
| `NotFoundError` | 404 | `NOT_FOUND` |
| `ConflictError` | 409 | `CONFLICT` |
| `RateLimitError` | 429 | `RATE_LIMIT_EXCEEDED` |
| `ServiceUnavailableError` | 503 | `SERVICE_UNAVAILABLE` |

---

## 7. Internationalization

- Project uses `next-intl` with `src/i18n/routing.ts` and `src/i18n/request.ts`
- All UI strings → `messages/*.json` (never hardcode Arabic/English in components)
- Locale routes live under `src/app/[locale]/`
