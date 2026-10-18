'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Download,
  Check,
  X,
  Search,
  Filter,
  Eye,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Document {
  id: string;
  document_type: string;
  verification_status: string;
  uploaded_at: string;
  storage_path: string;
  file_url: string;
  rejection_reason?: string;
  profiles?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  travel_requests?: {
    booking_reference: string;
    vertical: string;
    booking_status: string;
  };
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [statusFilter, typeFilter, page]);

  async function fetchDocuments() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      });
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);

      const response = await fetch(`/api/admin/documents?${params}`);
      const result = await response.json();
      if (result.success) {
        setDocuments(result.data.documents);
        setPagination(result.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyDocument(action: 'approve' | 'reject') {
    if (!selectedDoc) return;

    if (action === 'reject' && !rejectionReason.trim()) {
      setActionError('يرجى إدخال سبب الرفض');
      return;
    }

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await fetch(`/api/admin/documents/${selectedDoc.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          rejection_reason: action === 'reject' ? rejectionReason : undefined,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setActionSuccess(result.message);
        setSelectedDoc(null);
        setActionType(null);
        setRejectionReason('');
        fetchDocuments();
      } else {
        setActionError(result.error?.message || 'فشلت العملية');
      }
    } catch (error) {
      setActionError('حدث خطأ في الاتصال');
    } finally {
      setActionLoading(false);
    }
  }

  function openActionDialog(doc: Document, action: 'approve' | 'reject') {
    setSelectedDoc(doc);
    setActionType(action);
    setRejectionReason('');
    setActionError(null);
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    verified: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  };

  const statusLabels: Record<string, string> = {
    pending: 'قيد المراجعة',
    verified: 'تمت الموافقة',
    rejected: 'مرفوض',
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">إدارة المستندات</h1>
          <p className="text-text-muted mt-1">مراجعة والموافقة على المستندات المرفوعة</p>
        </div>
        {actionSuccess && (
          <div className="text-sm bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl">
            ✓ {actionSuccess}
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">الحالة</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">الكل</SelectItem>
                  <SelectItem value="pending">قيد المراجعة</SelectItem>
                  <SelectItem value="verified">تمت الموافقة</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">نوع المستند</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">الكل</SelectItem>
                  <SelectItem value="PASSPORT">جواز السفر</SelectItem>
                  <SelectItem value="NATIONAL_ID">البطاقة الشخصية</SelectItem>
                  <SelectItem value="VISA">التأشيرة</SelectItem>
                  <SelectItem value="PHOTO">صورة شخصية</SelectItem>
                  <SelectItem value="OTHER">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={() => fetchDocuments()} variant="outline">
                <Search className="h-4 w-4 mr-2" />
                بحث
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="قيد المراجعة"
          value={documents.filter((d) => d.verification_status === 'pending').length}
          color="yellow"
        />
        <StatCard
          icon={<Check className="h-5 w-5" />}
          label="تمت الموافقة"
          value={documents.filter((d) => d.verification_status === 'verified').length}
          color="green"
        />
        <StatCard
          icon={<X className="h-5 w-5" />}
          label="مرفوضة"
          value={documents.filter((d) => d.verification_status === 'rejected').length}
          color="red"
        />
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>المستندات ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-3 text-text-muted opacity-30" />
              <p className="text-text-muted">لا توجد مستندات</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  statusColors={statusColors}
                  statusLabels={statusLabels}
                  onApprove={() => openActionDialog(doc, 'approve')}
                  onReject={() => openActionDialog(doc, 'reject')}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                السابق
              </Button>
              <span className="text-sm text-text-muted">
                {page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
              >
                التالي
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog
        open={actionType !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActionType(null);
            setSelectedDoc(null);
            setRejectionReason('');
            setActionError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'الموافقة على المستند' : 'رفض المستند'}
            </DialogTitle>
            <DialogDescription>
              {selectedDoc?.document_type} -{' '}
              {selectedDoc?.profiles
                ? `${selectedDoc.profiles.first_name || ''} ${selectedDoc.profiles.last_name || ''} (${selectedDoc.profiles.email})`
                : 'عميل'}
            </DialogDescription>
          </DialogHeader>

          {actionType === 'reject' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">سبب الرفض *</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="اذكر السبب..."
                rows={4}
              />
            </div>
          )}

          {actionError && (
            <div className="text-sm bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">
              {actionError}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionType(null);
                setSelectedDoc(null);
              }}
              disabled={actionLoading}
            >
              إلغاء
            </Button>
            <Button
              onClick={() => handleVerifyDocument(actionType!)}
              disabled={actionLoading || (actionType === 'reject' && !rejectionReason.trim())}
              className={
                actionType === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {actionLoading ? 'جاري المعالجة...' : actionType === 'approve' ? 'موافقة' : 'رفض'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocumentCard({
  document,
  statusColors,
  statusLabels,
  onApprove,
  onReject,
}: {
  document: Document;
  statusColors: Record<string, string>;
  statusLabels: Record<string, string>;
  onApprove: () => void;
  onReject: () => void;
}) {
  const customerName = document.profiles
    ? `${document.profiles.first_name || ''} ${document.profiles.last_name || ''}`.trim() ||
      document.profiles.email
    : 'عميل';

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div className="p-3 bg-blue-50 rounded-lg">
          <FileText className="h-6 w-6 text-blue-600" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{document.document_type}</h4>
            <Badge className={statusColors[document.verification_status]} variant="outline">
              {statusLabels[document.verification_status]}
            </Badge>
          </div>

          <p className="text-sm text-text-muted mt-1">{customerName}</p>

          {document.travel_requests && (
            <p className="text-xs text-text-muted mt-1">
              {document.travel_requests.booking_reference} • {document.travel_requests.vertical}
            </p>
          )}

          <p className="text-xs text-text-muted mt-1">
            {new Date(document.uploaded_at).toLocaleString('ar-EG')}
          </p>

          {document.rejection_reason && (
            <div className="mt-2 text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
              <strong>سبب الرفض:</strong> {document.rejection_reason}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <a
          href={`/api/admin/documents/${document.id}/download`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </a>

        {document.verification_status === 'pending' && (
          <>
            <Button variant="outline" size="sm" onClick={onApprove} className="text-green-600">
              <Check className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onReject} className="text-red-600">
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'yellow' | 'green' | 'red';
}) {
  const colorClasses = {
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <Card className={`border-2 ${colorClasses[color]}`}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/50 rounded-lg">{icon}</div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm font-medium">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
