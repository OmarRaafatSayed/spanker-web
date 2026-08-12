# Code Refactor Audit - Spanker Project

## Critical Issues Found

### 1. crm-adapter.ts (580 lines) - CRITICAL
**File**: `src/lib/services/crm-adapter.ts`

**Violation**: 7 responsibilities in one file
- Session token resolution & storage
- API request handling + error handling
- System logging
- Operation queue management
- Retry logic with exponential backoff
- Operation state tracking
- Type definitions (interfaces embedded)

**Required Split**:
```
src/lib/services/
├── auth/
│   └── token-resolver.ts (Token management only)
├── api/
│   ├── fetch-client.ts (HTTP requests only)
│   └── error-handler.ts (Error handling only)
├── queue/
│   ├── operation-queue.ts (Queue management only)
│   └── queue-processor.ts (Processing only)
├── logging/
│   └── system-logger.ts (Logging only)
├── retry/
│   └── retry-strategy.ts (Retry logic only)
└── types/
    └── crm-types.ts (All interfaces)
```

---

### 2. icons.tsx (580 lines) - CRITICAL
**File**: `src/components/icons.tsx`

**Violation**: Icon component definitions mixed with rendering logic
- 100+ icon components in single render file
- No separate icon registry
- No lazy loading

**Required Split**:
```
src/components/icons/
├── index.ts (Export registry)
├── icon-registry.ts (Icon definitions)
├── IconWrapper.tsx (Render wrapper)
└── icons/ (Organized by category)
    ├── travel.tsx
    ├── hotel.tsx
    ├── flight.tsx
    └── ...
```

---

### 3. design-system-showcase.tsx (556 lines) - HIGH
**File**: `src/components/design-system-showcase.tsx`

**Violation**: Demo + components mixed
- Multiple state management in one render
- 20+ different component showcases
- Navigation logic embedded

**Required Split**:
```
src/components/showcase/
├── DesignSystemShowcase.tsx (Router only)
├── sections/ (Each section isolated)
│   ├── TypographyShowcase.tsx
│   ├── ColorPaletteShowcase.tsx
│   ├── ButtonShowcase.tsx
│   └── ...
└── utils/
    └── showcase-helpers.ts
```

---

### 4. api.ts (484 lines) - HIGH
**File**: `src/lib/api.ts`

**Violation**: All API endpoints in one file
- Auth endpoints + business logic + CRM endpoints mixed
- 30+ functions with no organization
- No separation of concerns

**Required Split**:
```
src/lib/api/
├── index.ts (Export registry)
├── endpoints/ (By domain)
│   ├── auth.ts (Login, signup only)
│   ├── travel-requests.ts (Travel domain)
│   ├── visa.ts (Visa operations)
│   ├── payments.ts (Payment operations)
│   └── profile.ts (User profile)
└── types.ts (Endpoint types)
```

---

### 5. FlightSearchWidget.tsx (376 lines) - HIGH
**File**: `src/components/home/FlightSearchWidget.tsx`

**Violation**: Search widget + form + validation + state all mixed
- Form state management
- Validation logic
- Search execution
- Result rendering
- Date handling

**Required Split**:
```
src/components/flight-search/
├── FlightSearchWidget.tsx (Container only)
├── hooks/
│   ├── useFlightForm.ts (Form state only)
│   ├── useFlightValidation.ts (Validation only)
│   └── useFlightSearch.ts (Search logic only)
├── components/
│   ├── FlightSearchForm.tsx (Form rendering only)
│   ├── SearchFilters.tsx (Filters only)
│   └── ResultsList.tsx (Results only)
└── types.ts
```

---

### 6. dashboard/profile/page.tsx (383 lines) - HIGH
**File**: `src/app/dashboard/profile/page.tsx`

**Violation**: Page + form + validation + submission mixed
- Profile form rendering
- Update logic
- Validation
- Error handling
- Loading states

**Required Split**:
```
src/app/dashboard/profile/
├── page.tsx (Route container only - 50 lines max)
├── ProfileEditForm.tsx (Form UI only)
├── hooks/
│   ├── useProfileForm.ts (Form state)
│   ├── useProfileValidation.ts (Validation)
│   └── useProfileUpdate.ts (API calls)
└── utils/
    └── profile-validators.ts
```

---

### 7. Navbar.tsx (368 lines) - MEDIUM
**File**: `src/components/layout/Navbar.tsx`

**Violation**: Navigation + menu + mobile logic mixed
- Desktop menu rendering
- Mobile menu handling
- Auth state management
- Navigation logic

**Required Split**:
```
src/components/layout/navbar/
├── Navbar.tsx (Container only)
├── DesktopNav.tsx (Desktop menu only)
├── MobileNav.tsx (Mobile menu only)
├── NavMenu.tsx (Menu items only)
└── hooks/
    └── useNavbar.ts
```

---

### 8. visa-application/page.tsx (320 lines) - MEDIUM
**File**: `src/app/visa-application/page.tsx`

**Violation**: Form + stepper + validation mixed
- Multi-step form logic
- Step state
- Validation per step
- Submission

**Required Split**:
```
src/app/visa-application/
├── page.tsx (Route only - 30 lines)
├── VisaApplicationForm.tsx (Container)
├── steps/
│   ├── PersonalInfoStep.tsx
│   ├── DocumentUploadStep.tsx
│   └── ReviewStep.tsx
├── hooks/
│   ├── useVisaForm.ts
│   └── useVisaSteps.ts
└── utils/
    └── visa-validators.ts
```

---

### 9. signup/page.tsx (309 lines) - MEDIUM
**File**: `src/app/signup/page.tsx`

**Violation**: Sign up form + validation + submission mixed
- Form rendering
- Validation rules
- API submission
- Error handling

**Required Split**:
```
src/app/signup/
├── page.tsx (Route only - 40 lines)
├── SignupForm.tsx (Form container)
├── hooks/
│   ├── useSignupForm.ts
│   ├── useSignupValidation.ts
│   └── useSignupSubmit.ts
└── utils/
    └── signup-validators.ts
```

---

## Summary

**Total Files Exceeding 200 Lines**: 27  
**Total Lines of Code to Refactor**: ~8,000+  
**Priority Refactors**: 9 files  

**Pattern**: All violations follow same issue:
- Business logic + UI rendering mixed
- Multiple responsibilities per file
- No service layer abstraction
- State management not isolated
- Validation logic not separated

## Refactor Strategy

1. Extract business logic → hooks (React)
2. Extract services → services/ (API layer)
3. Extract types → types/ (Type definitions)
4. Extract utilities → utils/ (Pure functions)
5. Keep components for rendering only
6. Max 150 lines per file
7. One responsibility per file
