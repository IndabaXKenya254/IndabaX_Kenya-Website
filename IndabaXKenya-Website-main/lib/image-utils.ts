// ═══════════════════════════════════════════════════════════════════════
// IMAGE OPTIMIZATION UTILITIES
// ═══════════════════════════════════════════════════════════════════════
// Helper functions for image optimization and blur placeholders
// ═══════════════════════════════════════════════════════════════════════

/**
 * Generates a Supabase Storage URL with image transformations
 *
 * @param url - Original Supabase storage URL or public URL
 * @param options - Transformation options
 * @returns Optimized image URL with transformations
 *
 * @example
 * ```ts
 * const optimized = getOptimizedImageUrl('/storage/v1/object/public/events/hero.jpg', {
 *   width: 800,
 *   quality: 80
 * })
 * ```
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  options: {
    width?: number
    height?: number
    quality?: number // 1-100, default 80
    format?: 'webp' | 'avif' | 'jpeg' | 'png'
  } = {}
): string {
  if (!url) return '/images/placeholder.jpg'

  // If it's not a Supabase storage URL, return as-is
  if (!url.includes('supabase.co/storage') && !url.includes('/storage/v1')) {
    return url
  }

  // Build transformation parameters
  const params = new URLSearchParams()

  if (options.width) params.append('width', options.width.toString())
  if (options.height) params.append('height', options.height.toString())
  if (options.quality) params.append('quality', options.quality.toString())
  if (options.format) params.append('format', options.format)

  // If no params, return original URL
  if (params.toString() === '') return url

  // Convert to render endpoint with transformations
  // /storage/v1/object/public/bucket/file.jpg
  // becomes
  // /storage/v1/render/image/public/bucket/file.jpg?width=800&quality=80

  const transformedUrl = url.replace(
    '/storage/v1/object/public/',
    `/storage/v1/render/image/public/`
  )

  return `${transformedUrl}?${params.toString()}`
}

/**
 * Generates a simple blur data URL for placeholder
 *
 * @param width - Blur placeholder width (small, e.g., 10)
 * @param height - Blur placeholder height (small, e.g., 10)
 * @returns Base64 encoded SVG blur placeholder
 *
 * @example
 * ```tsx
 * <Image
 *   src={imageUrl}
 *   placeholder="blur"
 *   blurDataURL={getBlurDataURL(10, 10)}
 * />
 * ```
 */
export function getBlurDataURL(width: number = 10, height: number = 10): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgb(243,244,246);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(229,231,235);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)" />
    </svg>
  `

  const base64 = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * Common image sizes for responsive images
 */
export const IMAGE_SIZES = {
  thumbnail: { width: 150, height: 150, quality: 75 },
  small: { width: 400, height: 300, quality: 80 },
  medium: { width: 800, height: 600, quality: 80 },
  large: { width: 1200, height: 900, quality: 85 },
  hero: { width: 1920, height: 1080, quality: 85 },
} as const

/**
 * Get responsive srcset for an image
 *
 * @param url - Original image URL
 * @returns Object with src and srcSet for responsive images
 *
 * @example
 * ```tsx
 * const { src, srcSet } = getResponsiveSrcSet(imageUrl)
 * <Image src={src} srcSet={srcSet} sizes="(max-width: 768px) 100vw, 50vw" />
 * ```
 */
export function getResponsiveSrcSet(url: string | null | undefined) {
  if (!url) return { src: '/images/placeholder.jpg', srcSet: '' }

  const srcSet = [
    `${getOptimizedImageUrl(url, { width: 400, quality: 75 })} 400w`,
    `${getOptimizedImageUrl(url, { width: 800, quality: 80 })} 800w`,
    `${getOptimizedImageUrl(url, { width: 1200, quality: 85 })} 1200w`,
  ].join(', ')

  return {
    src: getOptimizedImageUrl(url, { width: 800, quality: 80 }),
    srcSet,
  }
}

/**
 * Checks if image should be lazy loaded based on position
 *
 * @param index - Image index in a list
 * @param threshold - Number of images to load eagerly (default: 4)
 * @returns Whether to lazy load this image
 */
export function shouldLazyLoad(index: number, threshold: number = 4): boolean {
  return index >= threshold
}
