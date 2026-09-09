# API Documentation - Spanker Booking System

**Version:** 1.0.0  
**Base URL:** `/api/v1`  
**Date:** 2026-09-07

---

## Table of Contents

- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Codes](#error-codes)
- [Endpoints](#endpoints)
  - [Flights](#flights)
  - [Hotels](#hotels)
  - [Visas](#visas)
  - [Trips](#trips)
  - [Bookings](#bookings)
  - [Payments](#payments)

---

## Authentication

Most endpoints require authentication via session cookies. Staff-only endpoints require additional role-based permissions.

### Authentication Levels

| Level | Description | Required For |
|-------|-------------|--------------|
| **Public** | No authentication | Search endpoints |
| **User** | Authenticated user | Create bookings, view own bookings |
| **Staff** | Staff role (admin/agent/reviewer) | Confirm bookings, confirm payments, review visas |
| **Admin** | Admin role only | (Reserved for future admin operations) |

### Headers

```http
Cookie: sb-access-token=<token>; sb-refresh-token=<token>
```

---

## Response Format

All API responses follow a standardized JSON structure:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

---

## Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| `400` | `VALIDATION_ERROR` | Invalid input data |
| `400` | `INVALID_INPUT` | Generic invalid input |
| `400` | `INVALID_DATE_RANGE` | Date range validation failed |
| `401` | `AUTHENTICATION_ERROR` | Not authenticated |
| `403` | `AUTHORIZATION_ERROR` | Access denied |
| `403` | `PROFILE_INCOMPLETE` | User profile is incomplete |
| `403` | `STAFF_ONLY` | Staff access required |
| `404` | `NOT_FOUND` | Resource not found |
| `404` | `BOOKING_NOT_FOUND` | Booking not found |
| `409` | `CONFLICT` | Resource conflict |
| `409` | `NO_AVAILABILITY` | No availability for selection |
| `409` | `INSUFFICIENT_SEATS` | Not enough seats available |
| `429` | `RATE_LIMIT_EXCEEDED` | Too many requests |
| `500` | `INTERNAL_ERROR` | Server error |

---

## Endpoints

---

## Flights

### Search Flights

Search for available flights with optional filters.

**Endpoint:** `GET /api/v1/flights/search`  
**Auth:** Public

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `origin` | string | No | Origin airport IATA code (e.g., `CAI`) |
| `destination` | string | No | Destination airport IATA code (e.g., `DXB`) |
| `departureDate` | string | No | Departure date (ISO 8601: `YYYY-MM-DD`) |
| `returnDate` | string | No | Return date for round-trip (ISO 8601) |
| `class` | string | No | `economy`, `business`, or `first` |
| `passengers` | integer | No | Number of passengers (1-9) |
| `tripType` | string | No | `one-way` or `round-trip` |

#### Example Request

```http
GET /api/v1/flights/search?origin=CAI&destination=DXB&departureDate=2026-10-15&class=economy&passengers=2&tripType=one-way
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "outbound": [
      {
        "id": "uuid",
        "airline": "EgyptAir",
        "flight_number": "MS915",
        "aircraft_type": "Boeing 777",
        "origin_iata": "CAI",
        "origin_city": "Cairo",
        "destination_iata": "DXB",
        "destination_city": "Dubai",
        "departure_at": "2026-10-15T18:00:00Z",
        "arrival_at": "2026-10-15T22:30:00Z",
        "class": "economy",
        "seats_available": 42,
        "base_price": 1500,
        "taxes_amount": 225,
        "total_price": 1725,
        "currency": "EGP",
        "baggage_kg": 20,
        "refundable": true
      }
    ]
  },
  "meta": {
    "count": 5
  }
}
```

---

## Hotels

### Search Hotels

Search for available hotels with date-range availability check.

**Endpoint:** `GET /api/v1/hotels/search`  
**Auth:** Public

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `city` | string | No | City name (e.g., `Sharm El Sheikh`) |
| `checkin` | string | No | Check-in date (ISO 8601: `YYYY-MM-DD`) |
| `checkout` | string | No | Check-out date (ISO 8601) |
| `guests` | integer | No | Number of guests (1-20) |
| `rooms` | integer | No | Number of rooms (1-10) |
| `room_type` | string | No | `standard`, `deluxe`, or `suite` |
| `min_stars` | integer | No | Minimum star rating (1-5) |
| `max_price` | number | No | Maximum price per night (EGP) |

#### Example Request

```http
GET /api/v1/hotels/search?city=Sharm%20El%20Sheikh&checkin=2026-10-15&checkout=2026-10-20&guests=2&rooms=1&room_type=deluxe&min_stars=5
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Four Seasons Resort Sharm El Sheikh",
      "slug": "four-seasons-sharm",
      "city": "Sharm El Sheikh",
      "country": "Egypt",
      "address": "1 Four Seasons Boulevard, Sharm El Sheikh",
      "star_rating": 5,
      "images": ["/images/hotels/four-seasons-sharm.jpg"],
      "amenities": ["pool", "spa", "beach_access", "gym", "golf"],
      "description_ar": "منتجع فور سيزونز الفاخر",
      "description_en": "Luxury Four Seasons resort",
      "check_in_time": "15:00",
      "check_out_time": "12:00",
      "price_per_night": 4500,
      "taxes_percent": 14,
      "currency": "EGP",
      "cancellation_hours": 72,
      "availability": [
        {
          "room_type": "deluxe",
          "rooms_left": 15
        }
      ]
    }
  ],
  "meta": {
    "count": 8,
    "filters": {
      "city": "Sharm El Sheikh",
      "checkin": "2026-10-15",
      "checkout": "2026-10-20",
      "room_type": "deluxe",
      "rooms": 1
    }
  }
}
```

---

## Visas

### Search Visa Programs

Search for visa programs with nationality eligibility check.

**Endpoint:** `GET /api/v1/visas/search`  
**Auth:** Public

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `destination` | string | No | Destination country name (e.g., `United Arab Emirates`) |
| `visa_type` | string | No | `tourist`, `business`, `student`, `work`, or `transit` |
| `nationality` | string | No | Applicant nationality (ISO 3166-1 alpha-2, e.g., `EG`) |

#### Example Request

```http
GET /api/v1/visas/search?destination=United%20Arab%20Emirates&visa_type=tourist&nationality=EG
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "destination_country": "United Arab Emirates",
      "country_code": "AE",
      "visa_type": "tourist",
      "processing_days": 5,
      "price": 650,
      "service_fee": 150,
      "total_price": 800,
      "currency": "EGP",
      "required_documents": ["passport", "photo", "hotel_booking", "bank_statement"],
      "optional_documents": ["travel_insurance"],
      "validity_months": 2,
      "max_stay_days": 30,
      "min_passport_validity_months": 6,
      "eligible_nationalities": ["EG", "SA", "KW", "QA", "BH", "OM"],
      "notes_ar": "تأشيرة سياحية للإمارات صالحة لشهر",
      "notes_en": "UAE tourist visa valid for one month"
    }
  ],
  "meta": {
    "count": 2,
    "filters": {
      "destination": "United Arab Emirates",
      "visa_type": "tourist",
      "nationality": "EG"
    }
  }
}
```

---

## Trips

### Search Trips

Search for available trips with filters.

**Endpoint:** `GET /api/v1/trips/search`  
**Auth:** Public

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `destination` | string | No | Destination name (e.g., `Marsa Alam`) |
| `start_date_from` | string | No | Minimum start date (ISO 8601) |
| `start_date_to` | string | No | Maximum start date (ISO 8601) |
| `duration_days` | integer | No | Trip duration in days (1-90) |
| `difficulty` | string | No | `easy`, `moderate`, or `challenging` |
| `min_price` | number | No | Minimum price per person (EGP) |
| `max_price` | number | No | Maximum price per person (EGP) |

#### Example Request

```http
GET /api/v1/trips/search?destination=Marsa%20Alam&difficulty=moderate&start_date_from=2026-10-01&max_price=10000
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title_ar": "رحلة غوص البحر الأحمر - مرسى علم",
      "title_en": "Red Sea Diving Safari - Marsa Alam",
      "slug": "red-sea-diving-marsa-alam",
      "destination": "Marsa Alam",
      "country": "Egypt",
      "duration_days": 5,
      "start_date": "2026-10-01",
      "end_date": "2026-10-05",
      "spots_available": 12,
      "group_size_max": 12,
      "price_per_person": 8500,
      "currency": "EGP",
      "difficulty": "moderate",
      "itinerary": [
        {
          "day": 1,
          "title": "Arrival & Orientation",
          "description": "Airport pickup, hotel check-in, equipment fitting"
        }
      ],
      "includes": ["4 nights accommodation", "Daily breakfast", "8 boat dives"],
      "excludes": ["International flights", "Travel insurance"],
      "meeting_point": "Marsa Alam International Airport",
      "meeting_time": "14:00",
      "cancellation_days": 14,
      "is_featured": true
    }
  ],
  "meta": {
    "count": 3,
    "filters": {
      "destination": "Marsa Alam",
      "difficulty": "moderate"
    }
  }
}
```

---

## Bookings

### Create Booking

Create a new booking for any vertical (flight/hotel/visa/trip).

**Endpoint:** `POST /api/v1/bookings`  
**Auth:** User (requires complete profile)

#### Request Body

The request body must include `vertical` and `data` fields. The structure of `data` depends on the vertical:

##### Flight Booking

```json
{
  "vertical": "flight",
  "data": {
    "flight_id": "uuid",
    "passengers": [
      {
        "title": "mr",
        "first_name": "Ahmed",
        "last_name": "Hassan",
        "date_of_birth": "1990-05-15",
        "passport_number": "A12345678",
        "passport_expiry": "2028-12-31",
        "nationality": "EG"
      }
    ],
    "contact": {
      "email": "ahmed@example.com",
      "phone": "+201234567890"
    },
    "special_requests": "Window seat preferred"
  }
}
```

##### Hotel Booking

```json
{
  "vertical": "hotel",
  "data": {
    "hotel_id": "uuid",
    "checkin_date": "2026-10-15",
    "checkout_date": "2026-10-20",
    "room_type": "deluxe",
    "rooms_count": 1,
    "guests": [
      {
        "title": "mr",
        "first_name": "Ahmed",
        "last_name": "Hassan"
      }
    ],
    "contact": {
      "email": "ahmed@example.com",
      "phone": "+201234567890"
    },
    "special_requests": "Late check-in"
  }
}
```

##### Visa Application

```json
{
  "vertical": "visa",
  "data": {
    "visa_id": "uuid",
    "applicant": {
      "title": "mr",
      "first_name": "Ahmed",
      "last_name": "Hassan",
      "date_of_birth": "1990-05-15",
      "passport_number": "A12345678",
      "passport_expiry": "2028-12-31",
      "passport_issue_date": "2018-01-01",
      "nationality": "EG",
      "occupation": "Engineer"
    },
    "contact": {
      "email": "ahmed@example.com",
      "phone": "+201234567890",
      "address": "123 Main St",
      "city": "Cairo",
      "country": "Egypt"
    },
    "travel_dates": {
      "intended_arrival": "2026-11-01",
      "intended_departure": "2026-11-15"
    },
    "purpose_of_visit": "Tourism"
  }
}
```

##### Trip Booking

```json
{
  "vertical": "trip",
  "data": {
    "trip_id": "uuid",
    "travelers": [
      {
        "title": "mr",
        "first_name": "Ahmed",
        "last_name": "Hassan",
        "date_of_birth": "1990-05-15",
        "nationality": "EG",
        "emergency_contact_name": "Sara Hassan",
        "emergency_contact_phone": "+201234567899"
      }
    ],
    "contact": {
      "email": "ahmed@example.com",
      "phone": "+201234567890"
    },
    "special_requests": "Vegetarian meals",
    "dietary_requirements": "No seafood"
  }
}
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "booking_id": "uuid",
    "reference": "SPK-FL-2026-A7X9K2",
    "status": "pending",
    "vertical": "flight",
    "total_amount": 1725,
    "currency": "EGP",
    "expires_at": "2026-09-07T15:15:00Z",
    "payment_id": null,
    "created_at": "2026-09-07T15:00:00Z"
  },
  "message": "Booking created successfully"
}
```

---

### Get My Bookings

Get current user's bookings with optional filters and pagination.

**Endpoint:** `GET /api/v1/bookings/my`  
**Auth:** User

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: `draft`, `pending`, `confirmed`, `cancelled`, `expired`, `refunded`, `completed` |
| `vertical` | string | No | Filter by vertical: `flight`, `hotel`, `visa`, `trip` |
| `from_date` | string | No | Filter bookings created after this date (ISO 8601) |
| `to_date` | string | No | Filter bookings created before this date (ISO 8601) |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (1-100, default: 10) |

#### Example Request

```http
GET /api/v1/bookings/my?status=confirmed&vertical=flight&page=1&limit=10
```

#### Example Response

```json
{
  "success": true,
  "data": [
    {
      "booking_id": "uuid",
      "reference": "SPK-FL-2026-A7X9K2",
      "status": "confirmed",
      "vertical": "flight",
      "total_amount": 1725,
      "currency": "EGP",
      "expires_at": null,
      "payment_id": "uuid",
      "created_at": "2026-09-07T15:00:00Z",
      "customer_id": "uuid",
      "contact": {
        "email": "ahmed@example.com",
        "phone": "+201234567890"
      },
      "flight_details": {
        "flight_id": "uuid",
        "airline": "EgyptAir",
        "flight_number": "MS915",
        "origin": "Cairo",
        "destination": "Dubai",
        "departure_at": "2026-10-15T18:00:00Z",
        "arrival_at": "2026-10-15T22:30:00Z",
        "passengers": [
          {
            "first_name": "Ahmed",
            "last_name": "Hassan",
            "passport_number": "A12345678"
          }
        ]
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "total_pages": 3
  }
}
```

---

### Cancel Booking

Cancel a booking and calculate refund amount based on cancellation policy.

**Endpoint:** `POST /api/v1/bookings/:id/cancel`  
**Auth:** User (owner) or Staff

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Booking ID (UUID) |

#### Request Body

```json
{
  "reason": "Travel plans changed"
}
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "booking_id": "uuid",
    "status": "cancelled",
    "refund_amount": 1293.75,
    "refund_percent": 75,
    "penalty_amount": 431.25,
    "original_amount": 1725,
    "cancelled_at": "2026-09-07T16:00:00Z"
  },
  "message": "Booking cancelled successfully"
}
```

---

### Confirm Booking (Staff)

Confirm a pending booking (staff only).

**Endpoint:** `POST /api/v1/bookings/:id/confirm`  
**Auth:** Staff (admin/agent)

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Booking ID (UUID) |

#### Request Body

```json
{
  "notes": "Payment verified via bank transfer"
}
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "booking_id": "uuid",
    "status": "confirmed",
    "confirmed_by": "uuid",
    "confirmed_at": "2026-09-07T16:30:00Z",
    "reference": "SPK-FL-2026-A7X9K2"
  },
  "message": "Booking confirmed successfully"
}
```

---

## Payments

### Confirm Payment (Staff)

Confirm a payment and update booking status (staff only).

**Endpoint:** `POST /api/v1/payments/confirm`  
**Auth:** Staff (admin/agent)

#### Request Body

```json
{
  "payment_id": "uuid",
  "bank_transfer_details": {
    "transfer_reference": "TRF123456789",
    "transfer_date": "2026-09-07",
    "receipt_url": "https://storage.example.com/receipts/123.pdf",
    "bank_name": "National Bank of Egypt"
  },
  "notes": "Transfer verified"
}
```

**Note:** `bank_transfer_details` is required only for `bank_transfer` payment method.

#### Example Response

```json
{
  "success": true,
  "data": {
    "payment_id": "uuid",
    "booking_id": "uuid",
    "status": "paid",
    "confirmed_by": "uuid",
    "confirmed_at": "2026-09-07T17:00:00Z"
  },
  "message": "Payment confirmed successfully"
}
```

---

## Visa Review

### Review Visa Application (Staff)

Review a visa application (staff only - reviewer role).

**Endpoint:** `POST /api/v1/visas/:id/review`  
**Auth:** Staff (admin/reviewer)

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Visa booking detail ID (UUID) |

#### Request Body

```json
{
  "decision": "approve",
  "notes": "All documents verified. Application approved."
}
```

**Decision Values:**
- `approve` - Approve visa application
- `reject` - Reject visa application
- `needs_more_info` - Request additional documents

For `needs_more_info`, include `required_documents`:

```json
{
  "decision": "needs_more_info",
  "notes": "Please provide updated bank statement",
  "required_documents": ["bank_statement", "employment_letter"]
}
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "visa_booking_detail_id": "uuid",
    "review_status": "approved",
    "reviewed_at": "2026-09-07T18:00:00Z",
    "reviewed_by": "uuid",
    "notes": "All documents verified. Application approved."
  },
  "message": "Visa application reviewed successfully"
}
```

---

## Rate Limiting

All endpoints are subject to rate limiting:

- **Public endpoints:** 100 requests per minute per IP
- **Authenticated endpoints:** 300 requests per minute per user
- **Staff endpoints:** 500 requests per minute per staff user

Rate limit headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1694098800
```

---

## Pagination

List endpoints support pagination via `page` and `limit` query parameters:

```http
GET /api/v1/bookings/my?page=2&limit=20
```

Response includes pagination metadata:

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

---

## Testing

### Postman Collection

Import the Postman collection: [Download here](#)

### cURL Examples

#### Search Flights

```bash
curl -X GET "https://yourdomain.com/api/v1/flights/search?origin=CAI&destination=DXB&departureDate=2026-10-15&class=economy&passengers=2"
```

#### Create Booking (Flight)

```bash
curl -X POST "https://yourdomain.com/api/v1/bookings" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "vertical": "flight",
    "data": {
      "flight_id": "uuid",
      "passengers": [{
        "title": "mr",
        "first_name": "Ahmed",
        "last_name": "Hassan",
        "date_of_birth": "1990-05-15",
        "passport_number": "A12345678",
        "passport_expiry": "2028-12-31",
        "nationality": "EG"
      }],
      "contact": {
        "email": "ahmed@example.com",
        "phone": "+201234567890"
      }
    }
  }'
```

---

## Support

For API support:
- **Email:** support@spanker.com
- **Documentation:** https://docs.spanker.com
- **Status Page:** https://status.spanker.com

---

**Last Updated:** 2026-09-07  
**API Version:** 1.0.0
