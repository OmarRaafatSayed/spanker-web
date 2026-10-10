export default function ProfileSecurityPage() {
  return (
    <div className="p-3 sm:p-4 md:p-6" dir="rtl">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">الأمان</h2>
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200 gap-3 sm:gap-0">
          <div className="flex-1">
            <p className="font-semibold text-sm sm:text-base text-gray-900">كلمة المرور</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">آخر تغيير منذ 30 يوم</p>
          </div>
          <button className="px-4 py-2 text-sm font-semibold text-green-600 hover:bg-green-50 rounded-lg transition-colors w-full sm:w-auto">
            تغيير
          </button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200 gap-3 sm:gap-0">
          <div className="flex-1">
            <p className="font-semibold text-sm sm:text-base text-gray-900">المصادقة الثنائية</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">غير مفعلة</p>
          </div>
          <button className="px-4 py-2 text-sm font-semibold text-green-600 hover:bg-green-50 rounded-lg transition-colors w-full sm:w-auto">
            تفعيل
          </button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200 gap-3 sm:gap-0">
          <div className="flex-1">
            <p className="font-semibold text-sm sm:text-base text-gray-900">الأجهزة المتصلة</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">جهاز واحد نشط</p>
          </div>
          <button className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors w-full sm:w-auto">
            عرض
          </button>
        </div>
      </div>
    </div>
  )
}
