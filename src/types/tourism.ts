export interface Hotel {
  id: string
  name: string
  nameEn: string
  location: string
  locationEn: string
  rating: number
  pricePerNight: number
  image: string
  amenities: string[]
  description: string
  descriptionEn: string
}

export interface Tour {
  id: string
  name: string
  nameEn: string
  destination: string
  destinationEn: string
  duration: number
  basePrice: number
  pricePerPerson: number
  maxPersons: number
  minPersons: number
  image: string
  highlights: string[]
  description: string
  descriptionEn: string
  includes: string[]
  category: string
}

export type TourCategory = "بحري" | "تاريخي" | "ثقافي" | "مغامرات"