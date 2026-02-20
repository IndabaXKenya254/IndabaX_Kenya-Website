# IndabaX Kenya - Tech-Forward Color System

**Theme Version**: 2.0 Tech-Forward
**Last Updated**: November 7, 2025
**Philosophy**: Balanced, tech-forward, with warm neutrals for visual interest

---

## 🎨 Color Palette Overview

### Primary Colors (Green - Dominant Brand)

The forest green represents growth, AI/tech innovation, and connects to the Kenyan flag in your logo.

```scss
$primary:          #006700  // Main green - CTAs, links, active states
$primary-light:    #008f00  // Hover states
$primary-lighter:  #00ba00  // Backgrounds, success messages
$primary-dark:     #004100  // Active/pressed states
$primary-subtle:   #bfffbf  // Very light backgrounds
```

**Usage:**
- Primary CTA buttons ("Register Now", "Apply", "Submit")
- Navigation active states
- Links and interactive elements
- Success indicators
- Key section accents

---

### Secondary Colors (Teal - Tech-Forward)

Soft teal/seafoam creates a modern, tech-forward aesthetic.

```scss
$secondary:        #91C1C5  // Card backgrounds, badges, tech elements
$secondary-light:  #b7e9ee  // Light section backgrounds
$secondary-lighter:#F8FFFC  // Main white background (cool tint)
$secondary-dark:   #72999c  // Muted depth
$secondary-darker: #557376  // Dark accents
```

**Usage:**
- Event/news card backgrounds
- Badge backgrounds
- Tech-related section backgrounds
- Info states and notifications
- Main site background (very subtle cool tint)

---

### Accent Colors (Energy + Warmth)

Creates balance with warm tones and highlights.

```scss
$accent-1: #BE511F  // Burnt orange - Secondary CTAs, highlights
$accent-2: #f86c2c  // Bright orange - Energy, warnings
$accent-3: #e2b273  // Muted gold - Awards, special badges
$accent-4: #B80101  // Bold red - Errors, urgent only
```

**Usage:**
- **Burnt Orange (#BE511F)**: "Featured" badges, secondary CTAs, important highlights
- **Bright Orange (#f86c2c)**: Warning states, energetic accents
- **Gold (#e2b273)**: Speaker awards, premium content, special events
- **Red (#B80101)**: Error messages only

---

### Neutral Colors

#### Dark Navy (Professional, Grounding)

```scss
$background-dark:     #02000D  // Footer, dark hero sections
$background-dark-alt: #02002A  // Stats sections, impact areas
$text-primary:        #02000D  // Primary headings, body text
```

#### Warm Neutrals (Visual Interest, Humanity)

```scss
$background-warm:       #F5DFC9  // Alternate section backgrounds
$background-warm-light: #E9DFDA  // Card backgrounds, subtle warmth
$text-warm:             #5f4a2d  // Text on warm backgrounds
$text-warm-medium:      #896b43  // Secondary text on warm
```

#### Cool Neutrals (Text, Borders)

```scss
$text-secondary: #636380  // Secondary text, captions
$text-tertiary:  #aeaebf  // Metadata, disabled states
$text-light:     #d6d6de  // Text on dark backgrounds
$border:         #aeaebf  // Default borders
$border-light:   #d6d6de  // Subtle dividers
```

---

## 📐 Usage Guidelines

### Section Backgrounds (Alternating Rhythm)

Create visual interest by alternating section backgrounds:

```
Section 1: White/Cool (#F8FFFC)
Section 2: Warm Neutral (#F5DFC9)
Section 3: Light Teal (#b7e9ee) - for tech content
Section 4: Warm Light (#E9DFDA)
Section 5: White/Cool (#F8FFFC)
Section 6: Dark Navy (#02000D or #02002A) - for stats/impact
```

### Button Hierarchy

```scss
// Primary CTA
background: $primary (#006700)
color: white
hover: $primary-light (#008f00)

// Secondary CTA
background: transparent
border: 2px solid $primary
color: $primary
hover: background $primary, color white

// Accent CTA (special actions)
background: $accent-1 (#BE511F)
color: white
hover: darken slightly
```

### Card Styling

**On White Background:**
```scss
background: $secondary (#91C1C5) or $background-warm-light (#E9DFDA)
border: none or subtle $border-light
text: $text-primary
```

**On Warm Background:**
```scss
background: white (#F8FFFC)
border: $border-warm (#cfb4a5)
text: $text-warm (#5f4a2d)
```

### Typography Colors

```scss
// On white/cool backgrounds
H1/H2: $text-primary (#02000D)
Body: $text-primary (#02000D)
Captions: $text-secondary (#636380)

// On warm backgrounds
H1/H2: $text-primary (#02000D) or $text-warm (#5f4a2d)
Body: $text-warm (#5f4a2d)
Captions: $text-warm-medium (#896b43)

// On dark backgrounds
H1/H2: white (#FFFFFF)
Body: $text-light (#d6d6de)
Captions: $text-tertiary (#aeaebf)
```

---

## 🎯 Component-Specific Recommendations

### Navigation
- Background: White (#F8FFFC) or Dark (#02000D)
- Active link: $primary (#006700)
- Hover: $primary-light (#008f00)

### Hero Section
- Background: Logo image with $gradient-hero-overlay
- Text: White
- CTA: $primary green button + $accent-1 burnt orange outline button

### Event Cards
- Background: $secondary (#91C1C5)
- Text: $text-primary
- "Featured" badge: $accent-1 (#BE511F) background

### Speaker Cards
- Background on warm section: White
- Flip side: $primary (#006700) background
- Awards badge: $accent-3 (#e2b273) gold

### Newsletter Section
- Bold option: $primary (#006700) full background, white text, $accent-1 submit button
- Balanced option: $background-warm (#F5DFC9) background, $primary submit button

### Footer
- Background: $background-dark (#02000D)
- Text: $text-light (#d6d6de)
- Links: $text-light, hover $primary

---

## ♿ Accessibility

All color combinations have been designed with WCAG AA compliance in mind:

✅ **Primary green (#006700) on white**: 4.5:1+
✅ **White text on primary green**: 4.5:1+
✅ **Navy (#02000D) on white**: 21:1
✅ **Navy on warm neutral (#F5DFC9)**: 15:1+
✅ **Burnt orange (#BE511F) on white**: 4.6:1+

Always test final implementations for contrast compliance.

---

## 🎨 Gradients Available

```scss
$gradient-primary       // Green depth gradient
$gradient-secondary     // Teal smooth gradient
$gradient-tech          // Teal → Green → Teal (tech vibe)
$gradient-warm          // Gold → Burnt Orange
$gradient-energy        // Green → Bright Orange (vibrant)
$gradient-overlay       // Dark navy overlay for images
$gradient-hero-overlay  // Dark to green overlay for hero
```

---

## 🚀 Implementation Status

- ✅ Main theme.scss updated with new colors
- ✅ CSS custom properties defined
- ⏳ Component-specific styles (next step)
- ⏳ Testing and refinement
- ⏳ Dark mode considerations (future)

---

## 📝 Notes

**Philosophy**: This color system balances:
- **Tech-forward**: Primary green, teal accents, dark navy sections
- **Warmth**: Warm neutrals, burnt orange, gold highlights
- **Professional**: High contrast, accessible, intentional

**Key Principle**: Green is dominant but not overwhelming. Use it for all primary actions and interactive elements, while warm neutrals and teal provide visual interest and breathing room.
