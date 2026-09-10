export function getImageUrl(path: string, fallback: string = "/images/hero/hero-1.jpg"): string {
  if (!path) return fallback
  
  // Handle both absolute and relative paths
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  
  return normalizedPath
}

export function getHotelImageUrl(hotelId: string): string {
  const hotelImages: Record<string, string> = {
    "1": "/images/hotels/hurghada-hotel.jpg",
    "2": "/images/hotels/sharm-resort.jpg", 
    "3": "/images/hotels/alexandria-historic.jpg",
    "4": "/images/hotels/marsa-alam-marine.jpg",
    "5": "/images/hotels/aswan-nile.jpg",
    "6": "/images/hotels/luxor-temple.jpg",
    "7": "/images/hotels/cairo-international.jpg"
  }
  
  return getImageUrl(hotelImages[hotelId], "/images/offers/hurghada.jpg")
}

export function getTourImageUrl(tourId: string): string {
  const tourImages: Record<string, string> = {
    "1": "/images/tours/hurghada-tropical.jpg",
    "2": "/images/tours/aswan-temples.jpg",
    "3": "/images/tours/alexandria-charming.jpg", 
    "4": "/images/tours/sharm-premium.jpg",
    "5": "/images/tours/marsa-alam-explorer.jpg",
    "6": "/images/tours/luxor-valley.jpg"
  }
  
  return getImageUrl(tourImages[tourId], "/images/offers/hurghada.jpg")
}