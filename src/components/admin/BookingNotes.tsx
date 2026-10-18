'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Star,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface Note {
  id: string;
  content: string;
  subject: string;
  sent_at: string;
  sent_by: string;
  metadata?: {
    is_important?: boolean;
    updated_at?: string;
  };
  profiles?: {
    first_name?: string;
    last_name?: string;
    email: string;
    role: string;
  };
}

interface BookingNotesProps {
  bookingId: string;
}

export function BookingNotes({ bookingId }: BookingNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editImportant, setEditImportant] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, [bookingId]);

  async function fetchNotes() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/notes`);
      const result = await response.json();
      if (result.success) {
        setNotes(result.data.notes);
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddNote() {
    if (!newNote.trim()) {
      setError('الرجاء كتابة ملاحظة');
      return;
    }

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: newNote,
          is_important: isImportant,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess('تمت إضافة الملاحظة بنجاح');
        setNewNote('');
        setIsImportant(false);
        setShowAddDialog(false);
        fetchNotes();
      } else {
        setError(result.error?.message || 'فشلت العملية');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdateNote() {
    if (!editingNote || !editContent.trim()) return;

    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/bookings/${bookingId}/notes/${editingNote.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            note: editContent,
            is_important: editImportant,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        setSuccess('تم تحديث الملاحظة');
        setEditingNote(null);
        fetchNotes();
      } else {
        setError(result.error?.message || 'فشل التحديث');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm('هل تريد حذف هذه الملاحظة؟')) return;

    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/bookings/${bookingId}/notes/${noteId}`,
        { method: 'DELETE' }
      );

      const result = await response.json();
      if (result.success) {
        setSuccess('تم حذف الملاحظة');
        fetchNotes();
      } else {
        setError(result.error?.message || 'فشل الحذف');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال');
    } finally {
      setActionLoading(false);
    }
  }

  function startEdit(note: Note) {
    setEditingNote(note);
    setEditContent(note.content);
    setEditImportant(note.metadata?.is_important || false);
    setError(null);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            ملاحظات الموظفين ({notes.length})
          </CardTitle>
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            إضافة ملاحظة
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {success && (
          <div className="mb-4 text-sm bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg">
            ✓ {success}
          </div>
        )}

        {error && (
          <div className="mb-4 text-sm bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد ملاحظات</p>
            <p className="text-xs mt-2">اضغط "إضافة ملاحظة" لكتابة ملاحظة جديدة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isEditing={editingNote?.id === note.id}
                editContent={editContent}
                editImportant={editImportant}
                onEditContentChange={setEditContent}
                onEditImportantChange={setEditImportant}
                onStartEdit={() => startEdit(note)}
                onCancelEdit={() => setEditingNote(null)}
                onSaveEdit={handleUpdateNote}
                onDelete={() => handleDeleteNote(note.id)}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Note Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة ملاحظة جديدة</DialogTitle>
            <DialogDescription>
              ملاحظة داخلية للموظفين فقط - لن يراها العميل
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="اكتب ملاحظتك هنا..."
                rows={5}
                className="resize-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="important"
                checked={isImportant}
                onCheckedChange={(checked) => setIsImportant(checked === true)}
              />
              <label htmlFor="important" className="text-sm font-medium cursor-pointer">
                <Star className="h-4 w-4 inline mr-1 text-yellow-600" />
                ملاحظة مهمة
              </label>
            </div>

            {error && (
              <div className="text-sm bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={actionLoading}
            >
              إلغاء
            </Button>
            <Button onClick={handleAddNote} disabled={actionLoading || !newNote.trim()}>
              {actionLoading ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function NoteCard({
  note,
  isEditing,
  editContent,
  editImportant,
  onEditContentChange,
  onEditImportantChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  actionLoading,
}: {
  note: Note;
  isEditing: boolean;
  editContent: string;
  editImportant: boolean;
  onEditContentChange: (value: string) => void;
  onEditImportantChange: (value: boolean) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  actionLoading: boolean;
}) {
  const authorName = note.profiles
    ? `${note.profiles.first_name || ''} ${note.profiles.last_name || ''}`.trim() ||
      note.profiles.email
    : 'موظف';

  const roleLabel: Record<string, string> = {
    admin: 'مدير',
    agent: 'وكيل',
    reviewer: 'مراجع',
    staff: 'موظف',
  };

  const isImportant = note.metadata?.is_important;
  const updatedAt = note.metadata?.updated_at;

  return (
    <div
      className={`border rounded-lg p-4 ${
        isImportant ? 'border-yellow-300 bg-yellow-50/50' : 'bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-sm">{authorName}</span>
            {note.profiles && (
              <Badge variant="secondary" className="text-xs">
                {roleLabel[note.profiles.role] || note.profiles.role}
              </Badge>
            )}
            {isImportant && (
              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">
                <Star className="h-3 w-3 mr-1" />
                مهم
              </Badge>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editContent}
                onChange={(e) => onEditContentChange(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`edit-important-${note.id}`}
                  checked={editImportant}
                  onCheckedChange={(checked) => onEditImportantChange(checked === true)}
                />
                <label
                  htmlFor={`edit-important-${note.id}`}
                  className="text-sm cursor-pointer"
                >
                  ملاحظة مهمة
                </label>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-secondary whitespace-pre-wrap">{note.content}</p>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
            <span>{new Date(note.sent_at).toLocaleString('ar-EG')}</span>
            {updatedAt && <span>• تم التعديل</span>}
          </div>
        </div>

        <div className="flex gap-1">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSaveEdit}
                disabled={actionLoading || !editContent.trim()}
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onCancelEdit} disabled={actionLoading}>
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={onStartEdit} disabled={actionLoading}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={actionLoading}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
