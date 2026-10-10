import { FileText } from "lucide-react"

export default function ProfileDocumentsPage() {
  return (
    <div className="p-3 sm:p-4 md:p-6" dir="rtl">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">المستندات</h2>
      <div className="text-center py-12 sm:py-16">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" />
        </div>
        <p className="text-sm sm:text-base text-gray-500">لا توجد مستندات محملة</p>
      </div>
    </div>
  )
}
