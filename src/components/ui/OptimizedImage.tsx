"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { getImageUrl } from "@/lib/image-utils"

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  fallback?: string
  aspectRatio?: "video" | "square" | "portrait"
}

export function OptimizedImage({ 
  src, 
  alt, 
  className, 
  fallback = "/images/hero/hero-1.jpg",
  aspectRatio = "video"
}: OptimizedImageProps) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  const aspectClasses = {
    video: "aspect-video",
    square: "aspect-square", 
    portrait: "aspect-[3/4]"
  }

  const imageUrl = error ? getImageUrl(fallback) : getImageUrl(src, fallback)

  return (
    <div className={cn(
      "relative overflow-hidden bg-gray-100",
      aspectClasses[aspectRatio],
      className
    )}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent" />
        </div>
      )}
      
      <img
        src={imageUrl}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          loading ? "opacity-0" : "opacity-100"
        )}
        onLoad={() => setLoading(false)}
        onError={() => {
          setError(true)
          setLoading(false)
        }}
        loading="lazy"
      />
    </div>
  )
}