# SweetAlert2 Implementation Guide

This guide provides comprehensive instructions for implementing SweetAlert2 across the IndabaX Kenya website for improved user feedback and error handling.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Utility Functions](#utility-functions)
4. [Implementation Patterns](#implementation-patterns)
5. [Files Updated](#files-updated)
6. [Remaining Files](#remaining-files)
7. [Testing Checklist](#testing-checklist)

---

## Overview

**Library Used:** `sweetalert2` + `sweetalert2-react-content`

**Purpose:** Replace Bootstrap alerts, custom Alert/Modal components, and basic error handling with beautiful, consistent SweetAlert2 alerts throughout the application.

**Benefits:**
- ✅ Consistent user experience across all forms and admin operations
- ✅ Better error messaging with validation support
- ✅ Loading states for async operations
- ✅ Confirmation dialogs for destructive actions
- ✅ Toast notifications for non-intrusive feedback
- ✅ Custom branded styling matching IndabaX colors

---

## Installation

Already completed:

```bash
npm install sweetalert2 sweetalert2-react-content
```

## File Locations

- **Utility Library:** `src/lib/sweetalert.ts`
- **Custom Styles:** `styles/sweetalert-custom.css` (root styles directory)
- **Global Import:** `src/app/layout.tsx`

---

## Utility Functions

Located at: `src/lib/sweetalert.ts`

### Available Functions

#### 1. `showSuccess(title, message?, timer?)`
```typescript
showSuccess('Success!', 'Operation completed successfully', 2000)
```
- **Use case:** Successful operations (create, update, delete)
- **Auto-closes:** Yes (default 2000ms)

#### 2. `showError(title, message?)`
```typescript
showError('Error', 'Something went wrong. Please try again.')
```
- **Use case:** Error messages, API failures
- **Auto-closes:** No (user must click OK)

#### 3. `showValidationError(errors)`
```typescript
showValidationError(['Name is required', 'Email must be valid'])
// or single error
showValidationError('All fields are required')
```
- **Use case:** Form validation errors
- **Supports:** Array of errors or single error message

#### 4. `showDeleteConfirmation(itemName?)`
```typescript
const confirmed = await showDeleteConfirmation('"John Doe"')
if (confirmed) {
  // Proceed with deletion
}
```
- **Use case:** Delete confirmations
- **Returns:** Promise<boolean>

#### 5. `showConfirmation(title, message, confirmText?, cancelText?)`
```typescript
const confirmed = await showConfirmation(
  'Publish Post?',
  'This will make the post visible to all users',
  'Publish',
  'Cancel'
)
```
- **Use case:** Any confirmation dialog
- **Returns:** Promise<boolean>

#### 6. `showLoading(title?, allowClose?)`
```typescript
showLoading('Processing...')
// ... perform async operation
closeAlert()
```
- **Use case:** Loading states during API calls
- **Must close:** Call `closeAlert()` when done

#### 7. `closeAlert()`
```typescript
closeAlert()
```
- **Use case:** Close any currently open alert

#### 8. `showToast(title, icon?, position?, timer?)`
```typescript
showToast('Saved!', 'success', 'top-end', 3000)
```
- **Use case:** Non-intrusive notifications
- **Icons:** 'success', 'error', 'warning', 'info'

#### 9. `showFormSuccess(title, message, redirectUrl?, redirectDelay?)`
```typescript
await showFormSuccess(
  'Submitted!',
  'Your application has been received',
  '/success-page',
  2000
)
```
- **Use case:** Form submission success with optional redirect

#### 10. `showApiError(userMessage, technicalDetails?)`
```typescript
showApiError(
  'Failed to connect to server',
  'Error 500: Internal Server Error\nEndpoint: /api/posts'
)
```
- **Use case:** API errors with technical details in collapsible section

---

## Implementation Patterns

### Pattern 1: Login Form (Error Handling)

**Before:**
```typescript
const [error, setError] = useState('')

// In JSX
{error && (
  <div className="alert alert-danger">
    {error}
  </div>
)}

// In handler
if (!result.success) {
  setError(result.error || 'Login failed')
}
```

**After:**
```typescript
import { showError, showLoading, closeAlert } from '@/lib/sweetalert'

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  showLoading('Logging in...')

  const result = await login(email, password)
  closeAlert()

  if (result.success) {
    router.push('/dashboard')
  } else {
    showError('Login Failed', result.error || 'Invalid credentials')
  }
}

// Remove error state and alert JSX
```

### Pattern 2: List Page (Delete Confirmation)

**Before:**
```typescript
const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null })

const handleDelete = async () => {
  const result = await api.delete(deleteModal.id)
  if (result.success) {
    setAlert({ type: 'success', message: 'Deleted' })
  }
}

// In JSX
<Modal
  isOpen={deleteModal.isOpen}
  onConfirm={handleDelete}
  title="Delete?"
/>
```

**After:**
```typescript
import { showDeleteConfirmation, showLoading, closeAlert, showSuccess, showError } from '@/lib/sweetalert'

const handleDelete = async (item: Item) => {
  const confirmed = await showDeleteConfirmation(`"${item.name}"`)
  if (!confirmed) return

  showLoading('Deleting...')

  try {
    const result = await api.delete(item.id)
    closeAlert()

    if (result.success) {
      showSuccess('Deleted!', 'Item deleted successfully', 2000)
      reloadData()
    } else {
      showError('Delete Failed', result.error)
    }
  } catch (error) {
    closeAlert()
    showError('Error', 'An unexpected error occurred')
  }
}

// Remove deleteModal state and Modal JSX
```

### Pattern 3: Create/Edit Form

**Before:**
```typescript
const [alert, setAlert] = useState(null)

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)

  if (!formData.title) {
    setAlert({ type: 'danger', message: 'Title required' })
    setLoading(false)
    return
  }

  const result = await api.create(formData)

  if (result.success) {
    setAlert({ type: 'success', message: 'Created!' })
    setTimeout(() => router.push('/list'), 1500)
  } else {
    setAlert({ type: 'danger', message: result.error })
  }
  setLoading(false)
}

// In JSX
{alert && <Alert type={alert.type} message={alert.message} />}
```

**After:**
```typescript
import { showSuccess, showError, showLoading, closeAlert, showValidationError } from '@/lib/sweetalert'

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  // Validation
  const errors = []
  if (!formData.title.trim()) errors.push('Title is required')
  if (!formData.content.trim()) errors.push('Content is required')

  if (errors.length > 0) {
    showValidationError(errors)
    return
  }

  setLoading(true)
  showLoading('Creating...')

  try {
    const result = await api.create(formData)
    closeAlert()

    if (result.success) {
      await showSuccess('Created!', 'Item created successfully', 2000)
      router.push('/list')
    } else {
      setLoading(false)
      showError('Creation Failed', result.error)
    }
  } catch (error) {
    closeAlert()
    setLoading(false)
    showError('Error', 'An unexpected error occurred')
  }
}

// Remove alert state and Alert JSX
```

### Pattern 4: Public Form (Contact, Registration)

**Before:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  // Basic form submission without feedback
  await fetch('/api/contact', { method: 'POST', body: JSON.stringify(data) })
}
```

**After:**
```typescript
import { showSuccess, showError, showLoading, closeAlert, showValidationError } from '@/lib/sweetalert'

const [formData, setFormData] = useState({ name: '', email: '', message: '' })
const [submitting, setSubmitting] = useState(false)

const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target
  setFormData(prev => ({ ...prev, [name]: value }))
}

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  // Validation
  if (!formData.name || !formData.email || !formData.message) {
    showValidationError('Please fill in all required fields')
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.email)) {
    showValidationError('Please enter a valid email address')
    return
  }

  setSubmitting(true)
  showLoading('Sending your message...')

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    closeAlert()

    if (response.ok) {
      showSuccess(
        'Message Sent!',
        'Thank you for contacting us. We will respond within 24 hours.',
        3000
      )
      // Reset form
      setFormData({ name: '', email: '', message: '' })
    } else {
      const error = await response.json()
      showError('Send Failed', error.message || 'Please try again')
    }
  } catch (error) {
    closeAlert()
    showError('Error', 'An unexpected error occurred. Please try again.')
  } finally {
    setSubmitting(false)
  }
}

// Update form inputs
<input
  name="name"
  value={formData.name}
  onChange={handleInputChange}
  disabled={submitting}
  required
/>
```

---

## Files Updated

✅ **Already Updated:**

1. `src/lib/sweetalert.ts` - Utility functions (NEW)
2. `src/styles/sweetalert-custom.css` - Custom styles (NEW)
3. `src/app/layout.tsx` - Import custom CSS
4. `src/app/admin/login/page.tsx` - Login error handling
5. `src/app/admin/posts/page.tsx` - List with delete confirmation
6. `src/app/admin/posts/new/page.tsx` - Create form with validation
7. `src/components/ContactUs/ContactForm.tsx` - Public form with validation

---

## Remaining Files to Update

### **Admin Pages (13 files)**

#### List Pages (5 files)
Update pattern: Delete confirmation + error handling

1. `src/app/admin/events/page.tsx`
2. `src/app/admin/speakers/page.tsx`
3. `src/app/admin/sponsors/page.tsx`
4. `src/app/admin/faqs/page.tsx`
5. `src/app/admin/gallery/page.tsx`

**Changes needed:**
- Import: `showSuccess, showError, showDeleteConfirmation, showLoading, closeAlert`
- Remove: `alert` state, `deleteModal` state, `Alert` component import, `Modal` component import
- Update: `handleDelete` to use `showDeleteConfirmation`
- Remove: Alert and Modal JSX

#### Create Pages (4 files)
Update pattern: Validation + success with redirect

1. `src/app/admin/events/new/page.tsx`
2. `src/app/admin/speakers/new/page.tsx`
3. `src/app/admin/sponsors/new/page.tsx`
4. `src/app/admin/faqs/new/page.tsx`

**Changes needed:**
- Import: `showSuccess, showError, showLoading, closeAlert, showValidationError, showToast`
- Remove: `alert` state, `Alert` component import
- Update: Validation to use `showValidationError`
- Update: Success to use `showSuccess` with redirect
- Update: File upload feedback to use `showToast`
- Remove: Alert JSX

#### Edit Pages (5 files)
Update pattern: Validation + update success + delete confirmation

1. `src/app/admin/events/[id]/page.tsx`
2. `src/app/admin/speakers/[id]/page.tsx`
3. `src/app/admin/sponsors/[id]/page.tsx`
4. `src/app/admin/faqs/[id]/page.tsx`
5. `src/app/admin/posts/[id]/page.tsx`

**Changes needed:**
- Same as Create pages
- Add delete confirmation like List pages

#### Other Admin Pages (4 files)

6. `src/app/admin/applications/page.tsx`
   - Update status change confirmations
   - Success toasts for updates

7. `src/app/admin/applications/[id]/page.tsx`
   - Review actions with confirmation
   - Success feedback

8. `src/app/admin/subscribers/page.tsx`
   - Export confirmation
   - Success feedback

9. `src/app/admin/settings/page.tsx`
   - Save confirmations
   - Success feedback

### **Public Forms (3 files)**

1. `src/components/Register/RegistrationForm.tsx`
   - Similar to ContactForm pattern
   - Add validation
   - Success message

2. `src/components/CallForPapers/SubmissionForm.tsx`
   - Similar to ContactForm pattern
   - Add validation
   - Success with redirect

3. `src/components/Common/Subscribe.tsx`
   - Add email validation
   - Success toast
   - Error handling

4. `src/components/Faq/ContactForm.tsx`
   - Same as ContactUs/ContactForm

---

## Step-by-Step Update Process

### For Each File:

1. **Import SweetAlert functions**
   ```typescript
   import { showSuccess, showError, showLoading, closeAlert, showDeleteConfirmation, showValidationError } from '@/lib/sweetalert'
   ```

2. **Remove old imports**
   ```typescript
   // Remove these:
   import { Alert, Modal } from '@/components/admin/ui'
   ```

3. **Remove state**
   ```typescript
   // Remove these:
   const [alert, setAlert] = useState(null)
   const [deleteModal, setDeleteModal] = useState({ isOpen: false, ... })
   ```

4. **Update handlers**
   - Replace `setAlert()` with `showSuccess()` or `showError()`
   - Replace modal open/close with `showDeleteConfirmation()`
   - Add `showLoading()` before async operations
   - Add `closeAlert()` after operations complete

5. **Remove JSX**
   ```typescript
   // Remove these:
   {alert && <Alert ... />}
   <Modal isOpen={deleteModal.isOpen} ... />
   ```

6. **Test the implementation**
   - Success cases
   - Error cases
   - Validation
   - Loading states

---

## Testing Checklist

### Admin Panel

- [ ] Login
  - [ ] Error on invalid credentials
  - [ ] Loading state during login

- [ ] Posts
  - [ ] Create success with redirect
  - [ ] Validation errors
  - [ ] Delete confirmation
  - [ ] Update success
  - [ ] Image upload feedback

- [ ] Events
  - [ ] Same as Posts

- [ ] Speakers
  - [ ] Same as Posts

- [ ] Sponsors
  - [ ] Same as Posts

- [ ] FAQs
  - [ ] Same as Posts

- [ ] Gallery
  - [ ] Delete confirmation
  - [ ] Upload success

- [ ] Applications
  - [ ] Status change confirmation
  - [ ] Update success feedback

- [ ] Subscribers
  - [ ] Export confirmation

- [ ] Settings
  - [ ] Save confirmation
  - [ ] Update success

### Public Forms

- [ ] Contact Form
  - [ ] Validation (all fields)
  - [ ] Email format validation
  - [ ] Submit success
  - [ ] Submit error
  - [ ] Form reset on success

- [ ] Registration Form
  - [ ] Same as Contact Form

- [ ] Call for Papers
  - [ ] Same as Contact Form

- [ ] Newsletter Subscribe
  - [ ] Email validation
  - [ ] Success toast
  - [ ] Error handling

---

## Common Issues & Solutions

### Issue 1: Alert doesn't close automatically
**Solution:** Make sure to call `closeAlert()` after async operations

### Issue 2: Multiple alerts stack up
**Solution:** Call `closeAlert()` before showing a new alert if needed

### Issue 3: Loading alert stays open on error
**Solution:** Always use try-catch and call `closeAlert()` in catch block

### Issue 4: Confirmation dialog doesn't wait for user
**Solution:** Use `await` when calling confirmation functions:
```typescript
const confirmed = await showDeleteConfirmation(item)
```

### Issue 5: Form doesn't reset after success
**Solution:** Reset form state after showing success:
```typescript
await showSuccess('Success!', 'Message sent')
setFormData({ name: '', email: '', message: '' })
```

---

## Best Practices

1. **Always handle loading states**
   ```typescript
   showLoading('Processing...')
   try {
     // operation
     closeAlert()
     showSuccess(...)
   } catch {
     closeAlert()
     showError(...)
   }
   ```

2. **Use appropriate alert types**
   - `showSuccess`: Successful operations
   - `showError`: Errors and failures
   - `showToast`: Non-critical notifications
   - `showConfirmation`: User decisions
   - `showValidationError`: Form validation

3. **Provide meaningful messages**
   - Bad: `showError('Error', 'Failed')`
   - Good: `showError('Delete Failed', 'Unable to delete post. It may be referenced by other content.')`

4. **Use confirmations for destructive actions**
   - Always confirm deletes
   - Consider confirming important updates
   - Use descriptive item names in confirmation

5. **Keep consistent timing**
   - Success alerts: 2000-3000ms
   - Toasts: 3000ms
   - Errors: No auto-close (user must acknowledge)

---

## Summary

- ✅ Installed: sweetalert2 + sweetalert2-react-content
- ✅ Created: Utility functions in `src/lib/sweetalert.ts`
- ✅ Created: Custom styles in `src/styles/sweetalert-custom.css`
- ✅ Updated: 7 example files (login, posts, contact)
- 📝 Remaining: 20 files to update using the patterns above

**Total files to update:** 27 files (7 done, 20 remaining)

Use this guide to systematically update all remaining files for a consistent, professional user experience throughout the IndabaX Kenya website.
