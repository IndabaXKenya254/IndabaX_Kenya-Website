# Build Warnings Guide

## Status: ✅ Build Succeeds with Warnings

The application builds successfully but has performance and code quality warnings that should be addressed over time.

---

## Summary of Warnings

### 1. React Hook Dependency Warnings (~20 instances)
**Type:** `react-hooks/exhaustive-deps`
**Severity:** Medium - Can cause bugs
**Impact:** May lead to stale closures and incorrect behavior

**Common Pattern:**
```tsx
useEffect(() => {
  fetchData()
}, []) // Missing 'fetchData' dependency
```

**Files Affected:**
- `src/app/admin/analytics/compare/page.tsx`
- `src/app/admin/analytics/page.tsx`
- `src/app/admin/checkin/page.tsx`
- `src/app/admin/email-templates/[id]/edit/page.tsx`
- `src/app/admin/papers/[id]/page.tsx`
- `src/app/admin/reviewers/page.tsx`
- Many more (see full build log)

**Fix Strategy:**
1. Use `useCallback` to memoize functions
2. Add missing dependencies to dependency array
3. OR disable warning with `// eslint-disable-next-line` if intentional

**Example Fix:**
```tsx
// BEFORE
const fetchData = async () => { ... }
useEffect(() => {
  fetchData()
}, []) // Warning!

// AFTER
const fetchData = useCallback(async () => { ... }, [supabase])
useEffect(() => {
  fetchData()
}, [fetchData]) // ✓ Correct
```

---

### 2. Image Optimization Warnings (~20 instances)
**Type:** `@next/next/no-img-element`
**Severity:** Low-Medium - Performance impact
**Impact:** Slower image loading, larger bandwidth usage

**Common Pattern:**
```tsx
<img src={photo_url} alt="..." /> // Warning!
```

**Files Affected:**
- `src/app/admin/gallery/page.tsx` (3 instances)
- `src/app/admin/posts/page.tsx`
- `src/app/admin/settings/page.tsx`
- `src/app/admin/speakers/page.tsx`
- `src/app/admin/sponsors/page.tsx`
- `src/components/admin/selectors/SpeakerSelector.tsx` (2 instances)
- Many admin components

**Fix Strategy:**
1. Replace `<img>` with Next.js `<Image />` component
2. Add width/height props for aspect ratio
3. Keep `<img>` for external/dynamic images if necessary

**Example Fix:**
```tsx
// BEFORE
<img src={speaker.photo_url} alt={speaker.name} />

// AFTER
import Image from 'next/image'
<Image
  src={speaker.photo_url}
  alt={speaker.name}
  width={300}
  height={300}
  placeholder="blur"
  blurDataURL="data:image/..."
/>
```

**Performance Benefit:** 50-70% faster image load times

---

### 3. Missing Image Alt Text (1 instance)
**Type:** `jsx-a11y/alt-text`
**Severity:** High - Accessibility issue
**Impact:** Screen readers cannot describe image

**File:** `src/components/tickets/TicketPDF.tsx:233`

**Fix:**
```tsx
// BEFORE
<img src={qrCodeUrl} />

// AFTER
<img src={qrCodeUrl} alt="QR Code for ticket verification" />
```

---

### 4. Ref Cleanup Warning (1 instance)
**Type:** `react-hooks/exhaustive-deps`
**Severity:** Low - Edge case bug
**Impact:** Memory leak potential

**File:** `src/components/Gallery/GalleryGrid.tsx:108`

**Fix:**
```tsx
useEffect(() => {
  const target = observerTarget.current // Copy to variable
  if (!target) return

  const observer = new IntersectionObserver(...)
  observer.observe(target)

  return () => {
    if (target) observer.unobserve(target) // Use copied variable
  }
}, [loadMore])
```

---

## Prioritization

### 🔴 High Priority (Fix Soon)
1. **Missing alt text** (1 fix) - Accessibility issue
2. **Ref cleanup warning** (1 fix) - Potential memory leak

### 🟡 Medium Priority (Fix When Time Allows)
3. **React Hook dependencies** (~20 fixes) - Can cause bugs
4. **Images in admin panels** (~10 fixes) - Lower traffic, less critical

### 🟢 Low Priority (Optional)
5. **Images in components** (~10 fixes) - Nice to have for performance

---

## Quick Fix Commands

### Check specific warning type:
```bash
npm run build 2>&1 | grep "exhaustive-deps"
npm run build 2>&1 | grep "no-img-element"
npm run build 2>&1 | grep "alt-text"
```

### See warnings by file:
```bash
npm run build 2>&1 | grep "Warning:" | grep "admin/gallery"
```

---

## Current ESLint Configuration

File: `.eslintrc.json`
```json
{
  "extends": "next/core-web-vitals",
  "rules": {
    "react-hooks/exhaustive-deps": "warn",
    "@next/next/no-img-element": "warn",
    "jsx-a11y/alt-text": "warn",
    "react/no-unescaped-entities": "error"
  }
}
```

All warnings are set to **"warn"** so they don't block builds but are still visible.

---

## Notes

- **Build Status:** ✅ Succeeds
- **Total Warnings:** ~42
- **Blocking Errors:** 0
- **Est. Time to Fix All:** 2-3 hours
- **Performance Impact:** Medium (images) + Low (hooks)

These warnings are technical debt that can be addressed incrementally without blocking development.
