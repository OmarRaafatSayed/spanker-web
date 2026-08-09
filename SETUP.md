# Setup Guide — Spanker × Travel CRM Integration

كل الخطوات اللي محتاجها عشان تشغّل الموقع متربط بالـ FastAPI backend.

---

## المتطلبات

- Node.js >= 24
- Python >= 3.12
- الـ backend repo: `egypt-ai-flow-main` (موجود locally)

---

## 1. Backend — FastAPI

### الموقع
```
egypt-ai-flow-main/egypt-ai-flow-main/travel-agency-custom/fastapi-backend/fastapi-backend/
```

### تشغيل
افتح terminal جديد في الـ directory ده وشغّل:
```bash
python main.py
```
بيشتغل على `http://localhost:8000`

### ملف `.env` (موجود بالفعل)
```env
ENVIRONMENT=development
SUPABASE_URL=https://dnzvcvlebltbfcbcslkt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=2XgGHCS2PFqjhIAkikiiut0AZNW3YHM+...
JWT_SECRET_KEY=2XgGHCS2PFqjhIAkikiiut0AZNW3YHM+...
JWT_ALGORITHM=HS256
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=http://localhost:4000,http://localhost:5173
USE_MOCK_FLIGHT_DATA=true
```

> **ملاحظة:** `USE_MOCK_FLIGHT_DATA=true` يعني الـ backend بيرجع mock data.
> لما تربط Amadeus أو Bright Data، تغيّره لـ `false`.

### تعديلات اتعملت على الـ backend
فيه تعديلين اتعملوا على ملفين في الـ backend عشان flight search يشتغل بدون login:

**`app/core/security.py`** — أُضيف في آخره:
```python
def optional_auth(credentials) -> TokenPayload | None:
    """Returns None instead of 401 when no token provided."""
    # ... (موجود في الملف)

OptionalToken = TokenPayload | None
```

**`app/routers/flights.py`** — الـ `search_flights` endpoint اتغيّر من:
```python
token: AuthToken = Depends(require_auth)
```
إلى:
```python
token: OptionalToken = Depends(optional_auth)
```
وكل references لـ `token.user_id` اتعملت None-safe.

---

## 2. Frontend — Next.js

### الموقع
```
spanker/
```

### ملف `.env.local` (موجود)
```env
NEXT_PUBLIC_API_URL=/api/backend
```

> الـ Next.js بيعمل **proxy** لكل طلبات `/api/backend/*` → `http://localhost:8000/api/v1/*`
> ده بيحل مشكلة CORS تلقائياً — مفيش حاجة تتعدّل في الـ backend CORS config.

### تشغيل
```bash
npm run dev
```
بيشتغل على `http://localhost:3000`

---

## 3. ترتيب التشغيل

```
1. شغّل الـ backend أولاً   →  python main.py          (port 8000)
2. شغّل الـ frontend         →  npm run dev             (port 3000)
3. افتح المتصفح              →  http://localhost:3000
```

---

## 4. الـ Architecture

```
Browser
  │
  │  يبعت لـ Next.js (same origin — no CORS)
  ▼
Next.js :3000
  │  /api/backend/* → proxy rewrite
  ▼
FastAPI :8000/api/v1/*
  │  service_role key
  ▼
Supabase (dnzvcvlebltbfcbcslkt)
```

---

## 5. Auth

### User موجود في Supabase
| Field    | Value                      |
|----------|----------------------------|
| Email    | `omarraafat939@gmail.com`  |
| Password | `NewPass123!`              |

### Flow
1. اضغط "دخول" في الـ Navbar
2. ادخل الـ email والـ password
3. الـ token بيتحفظ في `localStorage` بـ key `travel_crm_sb_session`
4. كل الـ protected endpoints (visa, hotels, payments) بتستخدمه تلقائياً

> **Flight search لا يحتاج login** — متاح للجميع.

---

## 6. الملفات اللي اتعملت في الـ frontend

| الملف | الوصف |
|-------|-------|
| `src/types/flights.ts` | TypeScript types للـ flight API response |
| `src/lib/api.ts` | API client — login, signup, searchFlights |
| `src/lib/auth-context.tsx` | AuthProvider + useAuth hook |
| `src/hooks/useFlightSearch.ts` | Hook يـ manage flight search state |
| `src/components/home/FlightResults.tsx` | عرض نتائج الرحلات |
| `src/components/home/FlightSearchWidget.tsx` | الـ search widget مربوط بالـ API |
| `src/components/ui/LoginModal.tsx` | Login/Signup modal |
| `src/components/layout/Navbar.tsx` | أُضيف login button + user state |
| `src/app/layout.tsx` | أُضيف AuthProvider |
| `src/app/page.tsx` | الـ FlightSearchWidget اتحط خارج الـ hero |
| `src/components/home/HeroBanner.tsx` | الـ widget اتشال منه (كان nested فيه) |
| `next.config.ts` | أُضيف `/api/backend` proxy rewrite |
| `.env.local` | `NEXT_PUBLIC_API_URL=/api/backend` |
| `scripts/smoke_test.py` | Smoke test يتحقق من كل الـ endpoints |

---

## 7. Smoke Test

```bash
python scripts/smoke_test.py
```

المتوقع:
```
PASSED: 10   FAILED: 0
```

يختبر: health checks لكل service، login، flight search anonymous، flight search authenticated، homepage.

---

## 8. API Endpoints المتاحة

Base: `http://localhost:3000/api/backend` (عبر الـ proxy)

| Endpoint | Auth | Notes |
|----------|------|-------|
| `POST /auth/login` | ❌ | `{email, password}` |
| `POST /auth/signup` | ❌ | `{email, password, first_name?, last_name?}` |
| `POST /flights/search` | ❌ | بدون login — public |
| `GET /hotels/search` | ✅ | يحتاج Bearer token |
| `POST /visa/applications` | ✅ | يحتاج Bearer token |
| `GET /payments` | ✅ | يحتاج Bearer token |

Full docs: `http://localhost:8000/docs` (development only)
