"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { PageShell } from "@/components/layout/PageShell"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"
import { getTourImageUrl } from "@/lib/image-utils"
import { OptimizedImage } from "@/components/ui/OptimizedImage"
import { Tour, TourCategory } from "@/types/tourism"



const SAMPLE_TOURS: Tour[] = [
  {
    id: "1",
    name: "رحلة الغردقة الاستوائية",
    nameEn: "Hurghada Tropical Getaway",
    destination: "الغردقة، البحر الأحمر",
    destinationEn: "Hurghada, Red Sea",
    duration: 4,
    basePrice: 2500,
    pricePerPerson: 1200,
    maxPersons: 8,
    minPersons: 2,
    image: getTourImageUrl("1"),
    highlights: ["الشعاب المرجانية", "الغطس", "رحلات القوارب", "الشواطئ الرملية"],
    description: "استمتع بأجمل 4 أيام في الغردقة مع رحلات الغطس والقوارب الزجاجية",
    descriptionEn: "Enjoy the best 4 days in Hurghada with diving and glass boat trips",
    includes: ["الإقامة 3 نجوم", "الإفطار", "رحلة غطس", "النقل من المطار"],
    category: "بحري"
  },
  {
    id: "2",
    name: "رحلة أسوان والمعابد",
    nameEn: "Aswan Temples Tour", 
    destination: "أسوان، صعيد مصر",
    destinationEn: "Aswan, Upper Egypt",
    duration: 3,
    basePrice: 1800,
    pricePerPerson: 900,
    maxPersons: 12,
    minPersons: 4,
    image: getTourImageUrl("2"),
    highlights: ["معبد فيلة", "السد العالي", "رحلة فلوكة نيلية", "جزيرة النباتات"],
    description: "اكتشف حضارة النوبة القديمة وجمال النيل في أسوان التاريخية",
    descriptionEn: "Discover ancient Nubian civilization and Nile beauty in historic Aswan",
    includes: ["الإقامة فندق نيلي", "جميع الوجبات", "دليل سياحي", "النقل المكيف"],
    category: "تاريخي"
  },
  {
    id: "3",
    name: "رحلة الإسكندرية الساحرة",
    nameEn: "Charming Alexandria Tour",
    destination: "الإسكندرية، البحر المتوسط", 
    destinationEn: "Alexandria, Mediterranean",
    duration: 2,
    basePrice: 1200,
    pricePerPerson: 600,
    maxPersons: 15,
    minPersons: 3,
    image: getTourImageUrl("3"),
    highlights: ["مكتبة الإسكندرية", "قلعة قايتباي", "الكورنيش", "المتحف الروماني"],
    description: "يومان في عروس البحر المتوسط بين التاريخ والجمال الطبيعي",
    descriptionEn: "Two days in the Pearl of Mediterranean between history and natural beauty",
    includes: ["الإقامة فندق 4 نجوم", "الإفطار والعشاء", "جولة مدينة", "النقل"],
    category: "ثقافي"
  },
  {
    id: "4",
    name: "رحلة شرم الشيخ المميزة",
    nameEn: "Premium Sharm El Sheikh Tour",
    destination: "شرم الشيخ، جنوب سيناء",
    destinationEn: "Sharm El Sheikh, South Sinai",
    duration: 5,
    basePrice: 3200,
    pricePerPerson: 1600,
    maxPersons: 10,
    minPersons: 2,
    image: getTourImageUrl("4"),
    highlights: ["رأس محمد", "دهب", "جبل سيناء", "دير سانت كاترين"],
    description: "رحلة مميزة لجنوب سيناء مع زيارة أهم المعالم الطبيعية والدينية",
    descriptionEn: "Premium South Sinai tour visiting top natural and religious landmarks",
    includes: ["منتجع 5 نجوم", "جميع الوجبات", "رحلات استكشافية", "النقل الفاخر"],
    category: "مغامرات"
  },
  {
    id: "5",
    name: "رحلة مرسى علم الاستكشافية",
    nameEn: "Marsa Alam Explorer Tour",
    destination: "مرسى علم، البحر الأحمر",
    destinationEn: "Marsa Alam, Red Sea",
    duration: 3,
    basePrice: 2100,
    pricePerPerson: 1050,
    maxPersons: 6,
    minPersons: 2,
    image: getTourImageUrl("5"),
    highlights: ["دغونج البحر", "السلاحف البحرية", "الشعاب البكر", "الصيد البحري"],
    description: "اكتشف كنوز البحر الأحمر الخفية في مرسى علم الساحرة",
    descriptionEn: "Discover hidden Red Sea treasures in enchanting Marsa Alam",
    includes: ["إيكولودج بحري", "الغطس المتقدم", "رحلات بحرية", "النقل البيئي"],
    category: "بحري"
  },
  {
    id: "6",
    name: "رحلة وادي الملوك التراثية",
    nameEn: "Valley of Kings Heritage Tour",
    destination: "الأقصر، وادي الملوك",
    destinationEn: "Luxor, Valley of Kings",
    duration: 4,
    basePrice: 2800,
    pricePerPerson: 1400,
    maxPersons: 8,
    minPersons: 3,
    image: getTourImageUrl("6"),
    highlights: ["مقبرة توت عنخ آمون", "معبد الكرنك", "معبد حتشبسوت", "رحلة بالون هوائي"],
    description: "رحلة تاريخية لا تنسى في قلب الحضارة الفرعونية العريقة",
    descriptionEn: "Unforgettable historical journey in the heart of ancient pharaonic civilization",
    includes: ["فندق تاريخي", "دليل مصريات", "رحلة البالون", "جميع التذاكر"],
    category: "تاريخي"
  }
]

const CATEGORIES = [
  { id: "all", label: "الكل", labelEn: "All" },
  { id: "بحري", label: "بحري", labelEn: "Marine" },
  { id: "تاريخي", label: "تاريخي", labelEn: "Historical" }, 
  { id: "ثقافي", label: "ثقافي", labelEn: "Cultural" },
  { id: "مغامرات", label: "مغامرات", labelEn: "Adventure" }
]

export default function ToursPage() {
  const { t, isRTL } = useI18n()
  const searchParams = useSearchParams()
  
  const [tours, setTours] = useState<Tour[]>(SAMPLE_TOURS)
  const [filteredTours, setFilteredTours] = useState<Tour[]>(SAMPLE_TOURS)
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null)
  const [bookingData, setBookingData] = useState({
    persons: 2,
    startDate: "",
    contactName: "",
    contactPhone: "",
    contactEmail: ""
  })

  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredTours(tours)
    } else {
      setFilteredTours(tours.filter(tour => tour.category === selectedCategory))
    }
  }, [selectedCategory, tours])

  const calculateTotalPrice = (tour: Tour, persons: number) => {
    return tour.basePrice + (tour.pricePerPerson * persons)
  }

  const handleBookTour = (tour: Tour) => {
    setSelectedTour(tour)
    setBookingData({
      persons: tour.minPersons,
      startDate: "",
      contactName: "",
      contactPhone: "",
      contactEmail: ""
    })
  }

  const submitBooking = () => {
    if (!selectedTour) return
    
    // Simulate booking submission
    alert(`تم حجز ${selectedTour.name} بنجاح!\nعدد الأشخاص: ${bookingData.persons}\nالسعر الإجمالي: ${calculateTotalPrice(selectedTour, bookingData.persons).toLocaleString()} ج.م`)
    setSelectedTour(null)
  }

  return (
    <PageShell
      pageId="tours"
      title="الرحلات السياحية"
      subtitle="اكتشف أجمل الوجهات مع رحلاتنا المنظمة"
      maxWidth="7xl"
    >
      <div className="space-y-6">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                selectedCategory === category.id
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Tours Grid */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            الرحلات المتاحة ({filteredTours.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTours.map((tour, index) => (
              <motion.div
                key={tour.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video relative overflow-hidden">
                  <OptimizedImage
                    src={tour.image}
                    alt={tour.name}
                    className="rounded-t-2xl"
                  />
                  <div className="absolute top-3 right-3 bg-green-600 text-white px-2 py-1 rounded-full text-sm font-medium">
                    {tour.duration} أيام
                  </div>
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-medium">
                    {tour.category}
                  </div>
                </div>
                
                <div className="p-4">
                  <h4 className="font-bold text-gray-900 mb-1">{tour.name}</h4>
                  <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                    <span>📍</span>
                    {tour.destination}
                  </p>
                  
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                    {tour.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {tour.highlights.slice(0, 3).map((highlight) => (
                      <span key={highlight} className="px-2 py-1 bg-green-50 text-xs font-medium text-green-700 rounded-full">
                        {highlight}
                      </span>
                    ))}
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">السعر الأساسي:</span>
                      <span className="font-semibold text-green-600">
                        {tour.basePrice.toLocaleString()} ج.م
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">للشخص الإضافي:</span>
                      <span className="font-semibold text-green-600">
                        +{tour.pricePerPerson.toLocaleString()} ج.م
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-3">
                      من {tour.minPersons} إلى {tour.maxPersons} أشخاص
                    </div>
                    
                    <button 
                      onClick={() => handleBookTour(tour)}
                      className="w-full px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                    >
                      احجز الرحلة
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {selectedTour && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">حجز الرحلة</h3>
              <button
                onClick={() => setSelectedTour(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">{selectedTour.name}</h4>
                <p className="text-sm text-gray-600">{selectedTour.destination}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عدد الأشخاص
                </label>
                <select
                  value={bookingData.persons}
                  onChange={(e) => setBookingData({...bookingData, persons: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  {Array.from(
                    { length: selectedTour.maxPersons - selectedTour.minPersons + 1 },
                    (_, i) => selectedTour.minPersons + i
                  ).map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? "شخص" : "أشخاص"}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ بداية الرحلة
                </label>
                <input
                  type="date"
                  value={bookingData.startDate}
                  onChange={(e) => setBookingData({...bookingData, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <input
                  type="text"
                  placeholder="الاسم الكامل"
                  value={bookingData.contactName}
                  onChange={(e) => setBookingData({...bookingData, contactName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
                
                <input
                  type="tel"
                  placeholder="رقم الهاتف"
                  value={bookingData.contactPhone}
                  onChange={(e) => setBookingData({...bookingData, contactPhone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
                
                <input
                  type="email"
                  placeholder="البريد الإلكتروني"
                  value={bookingData.contactEmail}
                  onChange={(e) => setBookingData({...bookingData, contactEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>السعر الأساسي:</span>
                    <span>{selectedTour.basePrice.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span>إضافي ({bookingData.persons} أشخاص):</span>
                    <span>{(selectedTour.pricePerPerson * bookingData.persons).toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between font-bold text-green-700 border-t border-green-200 pt-2">
                    <span>المجموع:</span>
                    <span>{calculateTotalPrice(selectedTour, bookingData.persons).toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedTour(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={submitBooking}
                  disabled={!bookingData.startDate || !bookingData.contactName || !bookingData.contactPhone}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  تأكيد الحجز
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </PageShell>
  )
}