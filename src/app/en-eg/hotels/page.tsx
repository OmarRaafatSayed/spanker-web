"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { PageShell } from "@/components/layout/PageShell"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"
import { getHotelImageUrl } from "@/lib/image-utils"
import { OptimizedImage } from "@/components/ui/OptimizedImage"
import { Hotel } from "@/types/tourism"



const SAMPLE_HOTELS: Hotel[] = [
  {
    id: "1",
    name: "فندق سويس إن الغردقة",
    nameEn: "Swiss Inn Hurghada",
    location: "الغردقة، البحر الأحمر",
    locationEn: "Hurghada, Red Sea",
    rating: 4.5,
    pricePerNight: 1200,
    image: getHotelImageUrl("1"),
    amenities: ["مسبح", "واي فاي مجاني", "إفطار", "موقف سيارات"],
    description: "فندق فاخر مطل على البحر الأحمر مع مرافق عالمية",
    descriptionEn: "Luxury beachfront hotel with world-class facilities"
  },
  {
    id: "2", 
    name: "منتجع شرم الشيخ ريزورت",
    nameEn: "Sharm El Sheikh Resort",
    location: "شرم الشيخ، جنوب سيناء",
    locationEn: "Sharm El Sheikh, South Sinai",
    rating: 4.8,
    pricePerNight: 1800,
    image: getHotelImageUrl("2"),
    amenities: ["شاطئ خاص", "سبا", "مطاعم متعددة", "غوص"],
    description: "منتجع شامل كليا مع شاطئ رملي خاص وأنشطة مائية",
    descriptionEn: "All-inclusive resort with private sandy beach and water activities"
  },
  {
    id: "3",
    name: "فندق الإسكندرية التاريخي",
    nameEn: "Alexandria Historic Hotel", 
    location: "الإسكندرية، البحر المتوسط",
    locationEn: "Alexandria, Mediterranean",
    rating: 4.3,
    pricePerNight: 950,
    image: getHotelImageUrl("3"),
    amenities: ["إطلالة البحر", "مركز أعمال", "صالة رياضية", "مطعم"],
    description: "فندق تاريخي في قلب الإسكندرية مع إطلالة رائعة على البحر المتوسط",
    descriptionEn: "Historic hotel in the heart of Alexandria with stunning Mediterranean views"
  },
  {
    id: "4",
    name: "منتجع مرسى علم البحري",
    nameEn: "Marsa Alam Marine Resort",
    location: "مرسى علم، البحر الأحمر",
    locationEn: "Marsa Alam, Red Sea",
    rating: 4.6,
    pricePerNight: 1400,
    image: getHotelImageUrl("4"),
    amenities: ["غوص متقدم", "مركز بحري", "شاطئ بكر", "إيكولودج"],
    description: "منتجع بيئي متخصص في الرياضات البحرية والحياة البرية",
    descriptionEn: "Eco-resort specializing in marine sports and wildlife"
  },
  {
    id: "5",
    name: "فندق أسوان النيلي الفاخر",
    nameEn: "Aswan Luxury Nile Hotel",
    location: "أسوان، النيل",
    locationEn: "Aswan, Nile",
    rating: 4.4,
    pricePerNight: 1100,
    image: getHotelImageUrl("5"),
    amenities: ["إطلالة النيل", "مسبح لانهائي", "سبا نوبي", "مطعم فاخر"],
    description: "فندق فاخر على ضفاف النيل مع تراث نوبي أصيل",
    descriptionEn: "Luxury Nile-side hotel with authentic Nubian heritage"
  },
  {
    id: "6",
    name: "فندق الأقصر الأثري",
    nameEn: "Luxor Archaeological Hotel",
    location: "الأقصر، وادي الملوك",
    locationEn: "Luxor, Valley of Kings",
    rating: 4.7,
    pricePerNight: 1350,
    image: getHotelImageUrl("6"),
    amenities: ["قريب من المعابد", "حمام سباحة", "جولات أثرية", "مطعم فرعوني"],
    description: "فندق استثنائي في قلب الأقصر الأثرية بجانب أهم المعابد الفرعونية",
    descriptionEn: "Exceptional hotel in the heart of archaeological Luxor next to major pharaonic temples"
  },
  {
    id: "7",
    name: "فندق القاهرة الدولي",
    nameEn: "Cairo International Hotel",
    location: "القاهرة، وسط البلد",
    locationEn: "Cairo, Downtown",
    rating: 4.2,
    pricePerNight: 850,
    image: getHotelImageUrl("7"),
    amenities: ["قريب من الأهرامات", "مركز مؤتمرات", "خدمة 24/7", "مطعم متعدد"],
    description: "فندق بيزنس في قلب القاهرة مع سهولة الوصول لكل المعالم السياحية",
    descriptionEn: "Business hotel in the heart of Cairo with easy access to all tourist landmarks"
  }
]

export default function HotelsPage() {
  const { t, isRTL } = useI18n()
  const searchParams = useSearchParams()
  
  const [hotels, setHotels] = useState<Hotel[]>(SAMPLE_HOTELS)
  const [loading, setLoading] = useState(false)
  const [searchData, setSearchData] = useState({
    destination: searchParams.get("destination") || "",
    checkIn: searchParams.get("checkin") || "",
    checkOut: searchParams.get("checkout") || "",
    guests: parseInt(searchParams.get("guests") || "2"),
    rooms: parseInt(searchParams.get("rooms") || "1")
  })

  const handleSearch = () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setHotels(SAMPLE_HOTELS)
      setLoading(false)
    }, 1000)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={cn(
        "text-lg",
        i < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"
      )}>
        ⭐
      </span>
    ))
  }

  return (
    <PageShell
      pageId="hotels"
      title="الفنادق"
      subtitle="احجز أفضل الفنادق بأسعار مميزة"
      maxWidth="7xl"
    >
      <div className="space-y-6">
        {/* Search Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">البحث عن فنادق</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الوجهة</label>
              <input
                type="text"
                value={searchData.destination}
                onChange={(e) => setSearchData({...searchData, destination: e.target.value})}
                placeholder="أين تريد الإقامة؟"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الوصول</label>
              <input
                type="date"
                value={searchData.checkIn}
                onChange={(e) => setSearchData({...searchData, checkIn: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ المغادرة</label>
              <input
                type="date"
                value={searchData.checkOut}
                onChange={(e) => setSearchData({...searchData, checkOut: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">عدد الضيوف</label>
              <select
                value={searchData.guests}
                onChange={(e) => setSearchData({...searchData, guests: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {[1,2,3,4,5,6].map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? "ضيف" : "ضيوف"}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">عدد الغرف</label>
              <select
                value={searchData.rooms}
                onChange={(e) => setSearchData({...searchData, rooms: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {[1,2,3,4].map(num => (
                  <option key={num} value={num}>{num} {num === 1 ? "غرفة" : "غرف"}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button
            onClick={handleSearch}
            disabled={loading}
            className="mt-4 w-full md:w-auto px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? "جاري البحث..." : "ابحث عن فنادق"}
          </button>
        </div>

        {/* Results */}
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            الفنادق المتاحة ({hotels.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((hotel, index) => (
              <motion.div
                key={hotel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video relative overflow-hidden">
                  <OptimizedImage
                    src={hotel.image}
                    alt={hotel.name}
                    className="rounded-t-2xl"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-medium">
                    {hotel.rating} ⭐
                  </div>
                </div>
                
                <div className="p-4">
                  <h4 className="font-bold text-gray-900 mb-1">{hotel.name}</h4>
                  <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                    <span>📍</span>
                    {hotel.location}
                  </p>
                  
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                    {hotel.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {hotel.amenities.slice(0, 3).map((amenity) => (
                      <span key={amenity} className="px-2 py-1 bg-gray-100 text-xs font-medium text-gray-700 rounded-full">
                        {amenity}
                      </span>
                    ))}
                    {hotel.amenities.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-xs font-medium text-gray-700 rounded-full">
                        +{hotel.amenities.length - 3} المزيد
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold text-green-600">
                        {hotel.pricePerNight.toLocaleString()} ج.م
                      </span>
                      <span className="text-sm text-gray-500"> / ليلة</span>
                    </div>
                    
                    <button className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors">
                      احجز الآن
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  )
}