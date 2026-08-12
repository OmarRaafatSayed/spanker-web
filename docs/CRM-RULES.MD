1. Data Schema Architecture (قواعد البيانات المترابطة)
علشان السيستم يشتغل صح، الـ Primary Database (PostgreSQL) محتاجة الهيكل المترابط ده:

users (جدول العملاء الأساسي):

id (UUID - PK)

email, phone, full_name, passport_number

status (Enum: LEAD, ACTIVE_CLIENT, INACTIVE)

created_at, updated_at

visa_applications (جدول التأشيرات والمستندات):

id (UUID - PK)

user_id (FK -> users.id)

country_code (e.g., "UAE", "DE")

status (Enum: DOCS_PENDING, UNDER_REVIEW, SUBMITTED_TO_EMBASSY, APPROVED, REJECTED)

documents (JSONB Array: [{ doc_type: "PASSPORT", url: "...", status: "VALIDATED" }])

quotations (جدول عروض الأسعار):

id (UUID - PK)

user_id (FK -> users.id)

visa_application_id (Nullable FK -> visa_applications.id)

items (JSONB: flight details, visa fees, service fee)

total_amount, currency

status (Enum: DRAFT, SENT, ACCEPTED, EXPIRED, REJECTED)

bookings (جدول الحجوزات المؤكدة):

id (UUID - PK)

user_id (FK -> users.id)

quotation_id (FK -> quotations.id)

booking_reference (e.g., PNR)

status (Enum: PENDING_PAYMENT, CONFIRMED, CANCELLED, COMPLETED)

financial_transactions (جدول المعاملات المالية):

id (UUID - PK)

booking_id (FK -> bookings.id)

user_id (FK -> users.id)

amount_paid, remaining_balance

payment_method (Enum: CASH, BANK_TRANSFER, POS)

receipt_url

2. The Detailed Data Pipeline (من الـ Portal إلى الـ CRM)
Plaintext
[Portal User Action] ---> [API Gateway / Event Router] ---> [CRM State Machine Engine]
المرحلة الأولى: الـ Lead Ingestion & Profile Creation

Trigger: العميل بيسجل على الفرونت أند أو بيبدأ يطلب استفسار.

Payload Event: USER_REGISTERED

Behind the Scenes:

الـ Controller بينشئ User جديد في users.

الـ Event Bus بيبعت Webhook لصفحة الـ Customer Directory في الـ CRM.

الحالة بتتسجل كـ LEAD أوتوماتيكياً.

المرحلة الثانية: Document Upload & State Machine Validation

Trigger: العميل بيرفع صور الجواز أو أوراق التأشيرة من الـ Portal.

Payload Event: VISA_DOCS_SUBMITTED

Behind the Scenes:

السيستم ينشئ سجل في visa_applications محدد بـ user_id.

الحالة للطلب بتتحول لـ DOCS_PENDING.

في الـ CRM: الموظف بتظهر له حالة الورق "قيد المراجعة". لما يضغط Approve Document في الـ CRM، الـ API بتبعت PATCH Request لتحديث الـ status لـ UNDER_REVIEW وبيطلع إشعار لحظي للعميل في الـ Portal.

المرحلة الثالثة: Dynamic Quotation Generation

Trigger: التأشيرة اتوافق على أوراقها أو العميل طلب رحلة مخصصة.

Payload Event: CREATE_QUOTATION

Behind the Scenes:

الموظف جوه الـ CRM بيعمل Generate لـ Quotation مرتبط بـ user_id و visa_application_id.

أول ما يتسيف، بيغير الـ Enum لـ SENT.

العميل بيجيله إشعار + زرار Accept Quote في الـ Portal.

المرحلة الرابعة: Quotation Transition to Booking & Ledger Invoicing

Trigger: العميل يدوس Accept Quote في الـ Portal.

Payload Event: QUOTE_ACCEPTED

Behind the Scenes:

الـ Backend بيحول حالة الـ Quote لـ ACCEPTED.

السيستم أوتوماتيكياً ينشئ record جديد في جدول bookings متعلّق بنفس الـ quotation_id.

حالة الحجز بتسجل PENDING_PAYMENT.

بيتم إنشاء سجل فاتورة متوقع في financial_transactions بالمبلغ الإجمالي والمتبقي.

المرحلة الخامسة: Manual Payment Settlement & Voucher Generation

Trigger: الموظف بيستلم النقدية/التحويل في المكتب ويدخل البيانات في الـ CRM.

Payload Event: PAYMENT_RECORDED

Behind the Scenes:

الـ CRM بيبعت POST Request لـ /api/v1/payments.

بيتحدث الـ remaining_balance لـ 0 في جدول financial_transactions.

حالة الحجز في bookings بتتحول لـ CONFIRMED.

الـ Engine بيكوّن ملف الـ PDF الخاص بالـ Voucher وبيتبعت إشعار للعميل على الـ Portal يقدر يحمل منه تذكرته أو إيصال الدفع.