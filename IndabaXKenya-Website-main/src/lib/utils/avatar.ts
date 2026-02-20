// ═══════════════════════════════════════════════════════════════════════
// AVATAR UTILITIES
// ═══════════════════════════════════════════════════════════════════════
// Generate Gmail-style initials avatars for users without profile pictures

/**
 * Extract initials from a name or email
 * Examples:
 * - "John Doe" -> "JD"
 * - "admin@example.com" -> "AD"
 * - "Jane" -> "JA"
 */
export function getInitials(name: string): string {
  if (!name || !name.trim()) return 'AD' // Default: Admin

  // Remove email domain if present
  const cleanName = name.includes('@') ? name.split('@')[0] : name

  // Split by spaces, hyphens, dots, underscores
  const parts = cleanName.split(/[\s\-._]+/).filter(Boolean)

  if (parts.length === 0) return 'AD'

  // Get first letter of first two parts (or just first if only one part)
  if (parts.length === 1) {
    // Single word: take first 2 letters
    return parts[0].substring(0, 2).toUpperCase()
  }

  // Multiple words: take first letter of each
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/**
 * Generate a color based on the name (deterministic)
 * Same name always gets same color
 */
export function getAvatarColor(name: string): string {
  const colors = [
    '#1abc9c', // Turquoise
    '#2ecc71', // Emerald
    '#3498db', // Blue
    '#9b59b6', // Purple
    '#34495e', // Dark Blue
    '#16a085', // Green Sea
    '#27ae60', // Nephritis
    '#2980b9', // Belize Hole
    '#8e44ad', // Wisteria
    '#2c3e50', // Midnight Blue
    '#f39c12', // Orange
    '#e74c3c', // Red
    '#e67e22', // Carrot
    '#95a5a6', // Concrete
    '#d35400', // Pumpkin
    '#c0392b', // Pomegranate
  ]

  // Generate hash from name
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash // Convert to 32bit integer
  }

  // Use hash to pick color
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

/**
 * Generate SVG data URL for initials avatar
 * Can be used directly in <img src={...} />
 */
export function generateInitialsAvatar(name: string, size: number = 100): string {
  const initials = getInitials(name)
  const bgColor = getAvatarColor(name)
  const fontSize = Math.floor(size * 0.4) // 40% of size

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="${bgColor}" />
      <text
        x="50%"
        y="50%"
        dominant-baseline="central"
        text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="600"
        fill="white"
      >${initials}</text>
    </svg>
  `

  // Encode SVG to data URL
  const encoded = encodeURIComponent(svg.trim())
  return `data:image/svg+xml,${encoded}`
}

/**
 * Get display name from email or full name
 * Examples:
 * - "admin@deeplearningindabaxkenya.com" -> "Admin"
 * - "john.doe@example.com" -> "John Doe"
 */
export function getDisplayName(identifier: string): string {
  if (!identifier || !identifier.trim()) return 'Admin'

  // If it's an email, extract the username part
  if (identifier.includes('@')) {
    const username = identifier.split('@')[0]

    // Replace dots/underscores/hyphens with spaces
    const nameParts = username
      .split(/[._-]+/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())

    return nameParts.join(' ')
  }

  // Otherwise, just capitalize first letter of each word
  return identifier
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
