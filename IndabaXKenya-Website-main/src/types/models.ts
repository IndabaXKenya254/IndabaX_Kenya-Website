// ═══════════════════════════════════════════════════════════════════════
// INDABAX KENYA - DATA MODEL INTERFACES
// ═══════════════════════════════════════════════════════════════════════
// Version: 1.0
// Date: October 16, 2025
// Description: TypeScript interfaces for all data models (Phase 1 - Mock Data)
// ═══════════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────────
// EVENT INTERFACES
// ───────────────────────────────────────────────────────────────────────

export interface Event {
  id: string;
  slug: string;
  title: string;
  date: string; // ISO date string (YYYY-MM-DD)
  endDate?: string; // ISO date string (optional for multi-day events)
  location: string; // City, Country
  venue: string; // Specific venue name
  image: string; // Path to event image
  description: string; // Full description (can be markdown/HTML)
  excerpt?: string; // Short description for cards
  type: "upcoming" | "past"; // Event status
  featured: boolean; // Show on homepage
  speakerIds?: string[]; // Array of speaker IDs
  tags?: string[]; // Event tags/categories
}

// ───────────────────────────────────────────────────────────────────────
// SPEAKER INTERFACES
// ───────────────────────────────────────────────────────────────────────

export interface Speaker {
  id: string;
  name: string;
  title: string; // Job title/position
  organization: string; // Company/institution
  photo: string; // Path to speaker photo
  bioShort: string; // 2-3 sentences for cards
  bioLong?: string; // Full bio (optional)
  linkedinUrl: string; // LinkedIn profile URL
  twitterUrl?: string; // Twitter profile (optional)
  websiteUrl?: string; // Personal website (optional)
  featured: boolean; // Show on homepage
  expertise?: string[]; // Areas of expertise
  country?: string; // Speaker's country
}

// ───────────────────────────────────────────────────────────────────────
// STATISTICS INTERFACES
// ───────────────────────────────────────────────────────────────────────

export interface Stat {
  id: string;
  label: string; // "Attendees", "Speakers", etc.
  value: number; // Numeric value for counter
  suffix?: string; // "+", "K", etc.
  icon: string; // Icon class name (e.g., "icofont-users")
  color?: string; // Custom color (optional)
}

export interface Stats {
  attendees: Stat;
  speakers: Stat;
  countries: Stat;
  years: Stat;
}

// ───────────────────────────────────────────────────────────────────────
// SITE SETTINGS INTERFACES
// ───────────────────────────────────────────────────────────────────────

export interface PopupSettings {
  enabled: boolean;
  title: string;
  content: string; // HTML content
  buttonText: string;
  buttonLink: string;
  delay: number; // Delay in seconds before showing
}

export interface SiteSettings {
  popup: PopupSettings;
  eventDate: string; // ISO date string for countdown timer
  eventEndDate: string; // ISO date string
  videoUrl: string; // YouTube video ID or full URL
  registrationUrl: string;
  submitPaperUrl: string;
}

// ───────────────────────────────────────────────────────────────────────
// POST/NEWS INTERFACES (for Phase 1 - Part 2)
// ───────────────────────────────────────────────────────────────────────

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Full article content
  featuredImage: string;
  author: string;
  authorPhoto?: string;
  publishedAt: string; // ISO date string
  updatedAt?: string;
  type: "news" | "announcement" | "blog";
  tags?: string[];
  featured?: boolean;
}

// ───────────────────────────────────────────────────────────────────────
// SCHEDULE INTERFACES (for Phase 1 - Part 2)
// ───────────────────────────────────────────────────────────────────────

export interface ScheduleItem {
  id: string;
  time: string; // "09:00 AM"
  duration: string; // "1 hour"
  title: string;
  description?: string;
  speaker?: string; // Speaker name
  speakerId?: string; // Reference to speaker
  room?: string; // Room/hall name
  type: "keynote" | "talk" | "workshop" | "break" | "networking";
}

export interface ScheduleDay {
  date: string; // ISO date string
  dayLabel: string; // "Day 1", "March 15"
  items: ScheduleItem[];
}

// ───────────────────────────────────────────────────────────────────────
// PHOTO/GALLERY INTERFACES (for Phase 1 - Part 2)
// ───────────────────────────────────────────────────────────────────────

export interface Photo {
  id: string;
  imageUrl: string; // Path to image (or video URL for videos)
  thumbnailUrl?: string; // Path to thumbnail (optional)
  year: number; // 2022, 2023, etc.
  eventId: string; // Reference to event
  eventName: string; // Event name for display
  caption?: string;
  photographer?: string;
  mediaType?: 'image' | 'video'; // Type of media (default: image)
  category?: string; // Photo category (e.g., NOAI, General, Keynotes)
}

// ───────────────────────────────────────────────────────────────────────
// FAQ INTERFACES (for Phase 1 - Part 2)
// ───────────────────────────────────────────────────────────────────────

export interface FAQ {
  id: string;
  question: string;
  answer: string; // Can be HTML
  category: string; // "Registration", "Venue", etc.
  order: number; // Display order
}

// ───────────────────────────────────────────────────────────────────────
// SPONSOR INTERFACES (for Phase 1 - Part 2)
// ───────────────────────────────────────────────────────────────────────

export interface Sponsor {
  id: string;
  name: string;
  logo: string; // Path to logo
  website: string; // Sponsor website URL
  tier: "platinum" | "gold" | "silver" | "bronze" | "partner";
  description?: string;
  order: number; // Display order within tier
}

// ───────────────────────────────────────────────────────────────────────
// TEAM MEMBER INTERFACES (for Phase 1 - Part 2)
// ───────────────────────────────────────────────────────────────────────

export interface TeamMember {
  id: string;
  name: string;
  role: string; // "Organizer", "Committee Member", etc.
  photo: string;
  bio?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  email?: string;
  order: number;
}

// ───────────────────────────────────────────────────────────────────────
// FORM DATA INTERFACES (for Phase 1 - Forms)
// ───────────────────────────────────────────────────────────────────────

export interface RegistrationFormData {
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  country: string;
  ticketType: "general" | "student" | "speaker";
  dietaryRequirements?: string;
  tshirtSize?: string;
  accessibilityNeeds?: string;
  agreeToTerms: boolean;
}

export interface CallForPapersFormData {
  name: string;
  email: string;
  organization: string;
  bio: string;
  linkedinUrl?: string;
  submissionType: "talk" | "workshop" | "poster";
  title: string;
  abstract: string;
  keywords: string;
  track: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface NewsletterFormData {
  email: string;
}

// ───────────────────────────────────────────────────────────────────────
// API RESPONSE INTERFACES (for Phase 2)
// ───────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    field?: string;
  };
}

// ═══════════════════════════════════════════════════════════════════════
// END OF DATA MODEL INTERFACES
// ═══════════════════════════════════════════════════════════════════════
