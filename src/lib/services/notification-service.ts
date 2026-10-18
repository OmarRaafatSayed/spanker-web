/**
 * Notification Service
 * Handles both in-app notifications and email notifications
 */

import { createServerClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/db/schema';

export type NotificationType =
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_expired'
  | 'payment_received'
  | 'payment_confirmed'
  | 'document_uploaded'
  | 'document_approved'
  | 'document_rejected'
  | 'status_changed';

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Create in-app notification
 */
export async function createNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase.from(TABLES.portalNotifications).insert({
      customer_id: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.message,
      travel_request_id: payload.relatedId ?? null,
      is_read: false,
    });

    if (error) {
      console.error('[Notification Service] Failed to create notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Notification Service] Error:', error);
    return false;
  }
}

/**
 * Send email notification
 * NOTE: This is a placeholder. In production, integrate with:
 * - SendGrid
 * - AWS SES
 * - Resend
 * - Mailgun
 */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    // TODO: Integrate with actual email service
    console.log('[Email Service] Sending email:', {
      to: payload.to,
      subject: payload.subject,
      preview: payload.text?.substring(0, 100),
    });

    // For now, just log the email
    // In production, replace this with actual email service
    if (process.env.NODE_ENV === 'production') {
      // Example with fetch to external email API:
      // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     personalizations: [{ to: [{ email: payload.to }] }],
      //     from: { email: process.env.FROM_EMAIL },
      //     subject: payload.subject,
      //     content: [
      //       { type: 'text/plain', value: payload.text || '' },
      //       { type: 'text/html', value: payload.html },
      //     ],
      //   }),
      // });
      // return response.ok;
    }

    return true;
  } catch (error) {
    console.error('[Email Service] Error:', error);
    return false;
  }
}

/**
 * Send booking confirmation notification
 */
export async function notifyBookingConfirmed(
  userId: string,
  bookingReference: string,
  customerEmail: string,
  bookingDetails: any
): Promise<void> {
  // In-app notification
  await createNotification({
    userId,
    type: 'booking_confirmed',
    title: 'تم تأكيد حجزك',
    message: `تم تأكيد طلب الحجز رقم ${bookingReference} بنجاح`,
    relatedId: bookingDetails.id,
    actionUrl: `/bookings/${bookingDetails.id}`,
  });

  // Email notification
  const emailHtml = generateBookingConfirmedEmail(bookingReference, bookingDetails);
  await sendEmail({
    to: customerEmail,
    subject: `تأكيد الحجز - ${bookingReference}`,
    html: emailHtml,
    text: `تم تأكيد حجزك رقم ${bookingReference}. شكراً لاختياركم SPANKER.`,
  });
}

/**
 * Send booking cancellation notification
 */
export async function notifyBookingCancelled(
  userId: string,
  bookingReference: string,
  customerEmail: string,
  refundAmount: number,
  reason?: string
): Promise<void> {
  const refundMessage = refundAmount > 0 
    ? `سيتم استرداد ${refundAmount.toLocaleString()} ج.م خلال 5-7 أيام عمل`
    : 'لا يوجد استرداد وفقاً لسياسة الإلغاء';

  // In-app notification
  await createNotification({
    userId,
    type: 'booking_cancelled',
    title: 'تم إلغاء الحجز',
    message: `تم إلغاء طلب الحجز رقم ${bookingReference}. ${refundMessage}`,
    metadata: { refundAmount, reason },
  });

  // Email notification
  const emailHtml = generateBookingCancelledEmail(bookingReference, refundAmount, reason);
  await sendEmail({
    to: customerEmail,
    subject: `إلغاء الحجز - ${bookingReference}`,
    html: emailHtml,
    text: `تم إلغاء حجزك رقم ${bookingReference}. ${refundMessage}`,
  });
}

/**
 * Send document verification notification
 */
export async function notifyDocumentStatus(
  userId: string,
  documentType: string,
  status: 'approved' | 'rejected',
  customerEmail: string,
  rejectionReason?: string
): Promise<void> {
  const isApproved = status === 'approved';
  
  await createNotification({
    userId,
    type: isApproved ? 'document_approved' : 'document_rejected',
    title: isApproved ? 'تمت الموافقة على المستند' : 'تم رفض المستند',
    message: isApproved
      ? `تمت الموافقة على ${documentType}`
      : `تم رفض ${documentType}. ${rejectionReason || 'يرجى رفع مستند صحيح'}`,
    metadata: { documentType, status, rejectionReason },
  });

  const emailHtml = generateDocumentStatusEmail(documentType, status, rejectionReason);
  await sendEmail({
    to: customerEmail,
    subject: `${isApproved ? 'موافقة' : 'رفض'} المستند - ${documentType}`,
    html: emailHtml,
    text: isApproved
      ? `تمت الموافقة على ${documentType}`
      : `تم رفض ${documentType}. يرجى رفع مستند صحيح.`,
  });
}

/**
 * Send payment confirmation notification
 */
export async function notifyPaymentConfirmed(
  userId: string,
  bookingReference: string,
  amount: number,
  customerEmail: string
): Promise<void> {
  await createNotification({
    userId,
    type: 'payment_confirmed',
    title: 'تم تأكيد الدفع',
    message: `تم تأكيد دفع ${amount.toLocaleString()} ج.م للحجز ${bookingReference}`,
    metadata: { amount },
  });

  const emailHtml = generatePaymentConfirmedEmail(bookingReference, amount);
  await sendEmail({
    to: customerEmail,
    subject: `تأكيد الدفع - ${bookingReference}`,
    html: emailHtml,
    text: `تم تأكيد دفعك بمبلغ ${amount.toLocaleString()} ج.م`,
  });
}

// ============================================================================
// Email Templates
// ============================================================================

function generateBookingConfirmedEmail(reference: string, details: any): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تأكيد الحجز</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">✓ تم تأكيد حجزك</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <p style="font-size: 18px; color: #333; line-height: 1.6;">
        مرحباً،
      </p>
      <p style="font-size: 16px; color: #555; line-height: 1.6;">
        يسعدنا إبلاغك بأنه تم تأكيد حجزك بنجاح! 🎉
      </p>
      
      <div style="background-color: #f0f9f4; border-right: 4px solid #2d6a4f; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0; font-size: 14px; color: #666;">رقم الحجز</p>
        <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #1b4332;">${reference}</p>
      </div>
      
      <div style="margin: 25px 0;">
        <h3 style="color: #1b4332; margin-bottom: 15px;">تفاصيل الحجز:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">النوع:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">${details.vertical || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #666;">المبلغ:</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">${details.total_amount?.toLocaleString() || 0} ج.م</td>
          </tr>
          <tr>
            <td style="padding: 10px; color: #666;">الحالة:</td>
            <td style="padding: 10px;"><span style="background-color: #d1fae5; color: #065f46; padding: 5px 15px; border-radius: 20px; font-size: 14px;">مؤكد</span></td>
          </tr>
        </table>
      </div>
      
      <p style="font-size: 14px; color: #666; line-height: 1.6;">
        يمكنك متابعة حجزك وتحميل المستندات المطلوبة من خلال حسابك على الموقع.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/bookings/${details.id}" 
           style="background-color: #2d6a4f; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
          عرض تفاصيل الحجز
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 14px; color: #666;">
        شكراً لاختياركم <strong style="color: #1b4332;">SPANKER</strong>
      </p>
      <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
        للاستفسارات، تواصل معنا عبر البريد الإلكتروني أو الهاتف
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateBookingCancelledEmail(reference: string, refundAmount: number, reason?: string): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>إلغاء الحجز</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #991b1b 0%, #dc2626 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">تم إلغاء الحجز</h1>
    </div>
    
    <div style="padding: 30px;">
      <p style="font-size: 16px; color: #555; line-height: 1.6;">
        تم إلغاء حجزك رقم <strong style="color: #991b1b;">${reference}</strong>
      </p>
      
      ${reason ? `
        <div style="background-color: #fef2f2; border-right: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: #666;">سبب الإلغاء:</p>
          <p style="margin: 5px 0 0 0; color: #991b1b;">${reason}</p>
        </div>
      ` : ''}
      
      <div style="background-color: ${refundAmount > 0 ? '#f0f9f4' : '#fef2f2'}; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #666;">مبلغ الاسترداد</p>
        <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold; color: ${refundAmount > 0 ? '#2d6a4f' : '#991b1b'};">
          ${refundAmount > 0 ? `${refundAmount.toLocaleString()} ج.م` : 'لا يوجد'}
        </p>
        ${refundAmount > 0 ? `
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">
            سيتم الاسترداد خلال 5-7 أيام عمل
          </p>
        ` : ''}
      </div>
      
      <p style="font-size: 14px; color: #666; line-height: 1.6;">
        نأسف لعدم إتمام الحجز. نتطلع لخدمتك في المستقبل.
      </p>
    </div>
    
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 14px; color: #666;">
        <strong style="color: #1b4332;">SPANKER</strong> - خدمات السفر والسياحة
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateDocumentStatusEmail(documentType: string, status: 'approved' | 'rejected', reason?: string): string {
  const isApproved = status === 'approved';
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isApproved ? 'موافقة' : 'رفض'} المستند</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: ${isApproved ? 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)' : 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)'}; padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">
        ${isApproved ? '✓ تمت الموافقة' : '✕ تم الرفض'}
      </h1>
    </div>
    
    <div style="padding: 30px;">
      <p style="font-size: 16px; color: #555; line-height: 1.6;">
        ${isApproved 
          ? `تمت الموافقة على مستند <strong>${documentType}</strong>`
          : `تم رفض مستند <strong>${documentType}</strong>`
        }
      </p>
      
      ${!isApproved && reason ? `
        <div style="background-color: #fef2f2; border-right: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: #666;">سبب الرفض:</p>
          <p style="margin: 5px 0 0 0; color: #991b1b;">${reason}</p>
        </div>
        <p style="font-size: 14px; color: #666;">
          يرجى رفع المستند الصحيح من خلال حسابك.
        </p>
      ` : ''}
    </div>
    
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 14px; color: #666;">
        <strong style="color: #1b4332;">SPANKER</strong>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function generatePaymentConfirmedEmail(reference: string, amount: number): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0;">
  <title>تأكيد الدفع</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">✓ تم تأكيد الدفع</h1>
    </div>
    
    <div style="padding: 30px;">
      <p style="font-size: 16px; color: #555; line-height: 1.6;">
        تم استلام وتأكيد دفعتك بنجاح!
      </p>
      
      <div style="background-color: #f0f9f4; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: #666;">المبلغ المدفوع</p>
        <p style="margin: 10px 0; font-size: 36px; font-weight: bold; color: #2d6a4f;">
          ${amount.toLocaleString()} ج.م
        </p>
        <p style="margin: 0; font-size: 14px; color: #666;">للحجز رقم: ${reference}</p>
      </div>
      
      <p style="font-size: 14px; color: #666; line-height: 1.6;">
        شكراً لثقتكم. سيتم معالجة طلبك في أقرب وقت.
      </p>
    </div>
    
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 14px; color: #666;">
        <strong style="color: #1b4332;">SPANKER</strong>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
