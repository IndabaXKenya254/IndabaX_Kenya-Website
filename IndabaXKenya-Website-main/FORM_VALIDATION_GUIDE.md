# Form Validation Guide

This guide explains how to use the centralized form validation utilities for all forms in the IndabaX Kenya website.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Validation Functions](#validation-functions)
4. [Validation Patterns](#validation-patterns)
5. [Best Practices](#best-practices)
6. [Examples](#examples)
7. [Error Messages](#error-messages)

---

## Overview

All form validation utilities are centralized in `/src/lib/validations/form-validation.ts`. This ensures:
- ✅ Consistent validation across all forms
- ✅ Reusable validation logic
- ✅ Standardized error messages
- ✅ Easy maintenance and updates

**Location:** `/src/lib/validations/form-validation.ts`

---

## Quick Start

### 1. Import the validation functions you need

```typescript
import {
  validateEmail,
  validatePhone,
  validateName,
  validatePassword,
  validateUrl,
  validateMessage
} from "@/lib/validations/form-validation";
```

### 2. Use validation in your form submission

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validate email
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    showValidationError(emailValidation.error!);
    return;
  }

  // Validate phone (optional field)
  const phoneValidation = validatePhone(formData.phone, false, true);
  if (!phoneValidation.isValid) {
    showValidationError(phoneValidation.error!);
    return;
  }

  // Continue with form submission...
};
```

### 3. Batch validation (recommended for forms with multiple fields)

```typescript
import { validateFields } from "@/lib/validations/form-validation";

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const validation = validateFields([
    { field: 'name', value: formData.name, type: 'name' },
    { field: 'email', value: formData.email, type: 'email', required: true },
    { field: 'phone', value: formData.phone, type: 'phone', required: false, strict: true },
    { field: 'message', value: formData.message, type: 'message', minLength: 10 },
  ]);

  if (!validation.isValid) {
    // Show all errors at once
    const errorMessages = Object.values(validation.errors);
    showValidationError(errorMessages);
    return;
  }

  // Continue with form submission...
};
```

---

## Validation Functions

### Email Validation

**Function:** `validateEmail(email: string, required: boolean = true): ValidationResult`

```typescript
const emailValidation = validateEmail(formData.email);
if (!emailValidation.isValid) {
  showError(emailValidation.error!);
}
```

**Pattern:** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` (RFC 5322 simplified)

**Examples:**
- ✅ `john@example.com`
- ✅ `jane.doe@university.edu`
- ❌ `invalid.email`
- ❌ `@example.com`

---

### Phone Number Validation

**Function:** `validatePhone(phone: string, required: boolean = false, strict: boolean = true): ValidationResult`

**Strict Mode (default):** E.164 international format
```typescript
const phoneValidation = validatePhone(formData.phone, false, true);
```

**Pattern (strict):** `/^\+?[1-9]\d{1,14}$/`

**Examples (strict):**
- ✅ `+254712345678`
- ✅ `+1234567890`
- ✅ `254712345678`
- ❌ `0712345678` (starts with 0)
- ❌ `+254 712 345 678` (contains spaces)

**Lenient Mode:** Allows common formatting
```typescript
const phoneValidation = validatePhone(formData.phone, false, false);
```

**Pattern (lenient):** `/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/`

**Examples (lenient):**
- ✅ `+254 712 345 678`
- ✅ `(254) 712-345-678`
- ✅ `+1-234-567-8900`

**Helper Functions:**
```typescript
// Normalize phone number (remove formatting)
const normalized = normalizePhone("+254 712 345 678"); // "+254712345678"

// Format for display
const formatted = formatPhoneDisplay("+254712345678"); // "+254 712 345 678"
```

---

### Name Validation

**Function:** `validateName(name: string, minLength: number = 2): ValidationResult`

```typescript
const nameValidation = validateName(formData.name);
if (!nameValidation.isValid) {
  showError(nameValidation.error!);
}
```

**Requirements:**
- Minimum 2 characters (configurable)
- Cannot be empty or whitespace only

**Examples:**
- ✅ `John Doe`
- ✅ `Jane`
- ❌ `J` (too short)
- ❌ ` ` (whitespace only)

---

### Password Validation

**Function:** `validatePassword(password: string): ValidationResult`

```typescript
const passwordValidation = validatePassword(formData.password);
if (!passwordValidation.isValid) {
  showError(passwordValidation.error!);
}
```

**Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one number
- At least one special character

**Examples:**
- ✅ `MyP@ssw0rd`
- ✅ `Secur3!Pass`
- ❌ `password` (no uppercase, number, or special char)
- ❌ `Pass123` (too short, no special char)

---

### URL Validation

**Function:** `validateUrl(url: string, required: boolean = false): ValidationResult`

```typescript
const urlValidation = validateUrl(formData.linkedin, false);
if (!urlValidation.isValid) {
  showError(urlValidation.error!);
}
```

**Pattern:** `/^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/`

**Examples:**
- ✅ `https://example.com`
- ✅ `http://www.example.com/path`
- ✅ `https://linkedin.com/in/username`
- ❌ `example.com` (no protocol)
- ❌ `ftp://example.com` (not http/https)

---

### Message/Textarea Validation

**Function:** `validateMessage(message: string, minLength: number = 10): ValidationResult`

```typescript
const messageValidation = validateMessage(formData.message, 10);
if (!messageValidation.isValid) {
  showError(messageValidation.error!);
}
```

**Requirements:**
- Minimum 10 characters (configurable)
- Cannot be empty or whitespace only

---

## Validation Patterns

### Direct Pattern Usage

If you need just the regex pattern:

```typescript
import { EMAIL_REGEX, PHONE_REGEX, URL_REGEX } from "@/lib/validations/form-validation";

if (EMAIL_REGEX.test(email)) {
  // Email is valid
}
```

### Boolean Validation

For simple true/false checks:

```typescript
import { isValidEmail, isValidPhone, isValidUrl } from "@/lib/validations/form-validation";

if (isValidEmail(email)) {
  // Email is valid
}

if (isValidPhone(phone, false)) {
  // Phone is valid (not required)
}
```

---

## Best Practices

### 1. Always Use Centralized Validation

❌ **Don't do this:**
```typescript
// Bad - inline validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  showError('Invalid email');
}
```

✅ **Do this:**
```typescript
// Good - use centralized validation
const emailValidation = validateEmail(email);
if (!emailValidation.isValid) {
  showError(emailValidation.error!);
}
```

### 2. Validate All Fields Before Showing Errors

❌ **Don't do this:**
```typescript
// Bad - shows only first error
if (!name) {
  showError('Name required');
  return;
}
if (!email) {
  showError('Email required');
  return;
}
```

✅ **Do this:**
```typescript
// Good - collect all errors
const errors = [];
const nameValidation = validateName(name);
if (!nameValidation.isValid) errors.push(nameValidation.error!);

const emailValidation = validateEmail(email);
if (!emailValidation.isValid) errors.push(emailValidation.error!);

if (errors.length > 0) {
  showValidationError(errors);
  return;
}
```

### 3. Use Batch Validation for Complex Forms

✅ **Best approach for forms with 5+ fields:**
```typescript
const validation = validateFields([
  { field: 'name', value: formData.name, type: 'name' },
  { field: 'email', value: formData.email, type: 'email' },
  { field: 'phone', value: formData.phone, type: 'phone', required: false },
  { field: 'password', value: formData.password, type: 'password' },
  { field: 'message', value: formData.message, type: 'message', minLength: 50 },
]);

if (!validation.isValid) {
  showValidationError(Object.values(validation.errors));
  return;
}
```

### 4. Handle Optional Fields Correctly

```typescript
// Phone is optional - only validate if provided
const phoneValidation = validatePhone(formData.phone, false, true);
//                                                      ^^^^^ required = false
if (!phoneValidation.isValid) {
  errors.push(phoneValidation.error!);
}
```

### 5. Use Appropriate Strictness for Phone Numbers

```typescript
// For international forms - use strict E.164 format
const phoneValidation = validatePhone(phone, true, true);

// For user-friendly forms - use lenient format
const phoneValidation = validatePhone(phone, false, false);
```

---

## Examples

### Example 1: Simple Contact Form

```typescript
"use client";

import React, { useState } from "react";
import { showValidationError, showSuccess } from "@/lib/sweetalert";
import { validateEmail, validateName, validateMessage } from "@/lib/validations/form-validation";

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const errors = [];

    const nameValidation = validateName(formData.name);
    if (!nameValidation.isValid) errors.push(nameValidation.error!);

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) errors.push(emailValidation.error!);

    const messageValidation = validateMessage(formData.message);
    if (!messageValidation.isValid) errors.push(messageValidation.error!);

    if (errors.length > 0) {
      showValidationError(errors);
      return;
    }

    // Submit form...
    const response = await fetch("/api/contact", {
      method: "POST",
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      showSuccess("Message sent successfully!");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Your Name"
      />
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Your Email"
      />
      <textarea
        name="message"
        value={formData.message}
        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        placeholder="Your Message"
      />
      <button type="submit">Send</button>
    </form>
  );
};

export default ContactForm;
```

### Example 2: Registration Form with Phone

```typescript
"use client";

import React, { useState } from "react";
import { showValidationError, showSuccess } from "@/lib/sweetalert";
import {
  validateEmail,
  validateName,
  validatePassword,
  validatePhone
} from "@/lib/validations/form-validation";

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = [];

    // Validate name
    const nameValidation = validateName(formData.name);
    if (!nameValidation.isValid) errors.push(nameValidation.error!);

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) errors.push(emailValidation.error!);

    // Validate phone (optional but must be valid if provided)
    const phoneValidation = validatePhone(formData.phone, false, true);
    if (!phoneValidation.isValid) errors.push(phoneValidation.error!);

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) errors.push(passwordValidation.error!);

    // Confirm password match
    if (formData.password !== formData.confirmPassword) {
      errors.push("Passwords do not match");
    }

    if (errors.length > 0) {
      showValidationError(errors);
      return;
    }

    // Submit form...
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};

export default RegisterForm;
```

### Example 3: Using Batch Validation

```typescript
"use client";

import React, { useState } from "react";
import { showValidationError } from "@/lib/sweetalert";
import { validateFields } from "@/lib/validations/form-validation";

const ApplicationForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    bio: "",
    linkedin: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Batch validation
    const validation = validateFields([
      { field: 'name', value: formData.name, type: 'name' },
      { field: 'email', value: formData.email, type: 'email' },
      { field: 'phone', value: formData.phone, type: 'phone', required: false, strict: true },
      { field: 'bio', value: formData.bio, type: 'message', minLength: 50 },
      { field: 'linkedin', value: formData.linkedin, type: 'url', required: false },
    ]);

    if (!validation.isValid) {
      showValidationError(Object.values(validation.errors));
      return;
    }

    // Additional custom validation
    if (!formData.organization.trim()) {
      showValidationError('Organization is required');
      return;
    }

    // Submit form...
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};

export default ApplicationForm;
```

---

## Error Messages

All error messages are defined in `VALIDATION_MESSAGES` constant:

```typescript
import { VALIDATION_MESSAGES } from "@/lib/validations/form-validation";

// Access predefined messages
console.log(VALIDATION_MESSAGES.email.required);    // "Email address is required"
console.log(VALIDATION_MESSAGES.email.invalid);     // "Please enter a valid email address"
console.log(VALIDATION_MESSAGES.phone.invalidStrict); // "Please enter a valid phone number in international format (e.g., +254712345678)"
```

### Standard Error Messages

#### Email
- `required`: "Email address is required"
- `invalid`: "Please enter a valid email address"
- `example`: "e.g., john@example.com"

#### Phone
- `required`: "Phone number is required"
- `invalid`: "Please enter a valid phone number"
- `invalidStrict`: "Please enter a valid phone number in international format (e.g., +254712345678)"
- `example`: "e.g., +254712345678 or +1234567890"

#### Name
- `required`: "Name is required"
- `tooShort`: "Name must be at least 2 characters"
- `example`: "e.g., John Doe"

#### Password
- `required`: "Password is required"
- `tooShort`: "Password must be at least 8 characters"
- `noUppercase`: "Password must contain at least one uppercase letter"
- `noNumber`: "Password must contain at least one number"
- `noSpecialChar`: "Password must contain at least one special character"
- `example`: "e.g., MyP@ssw0rd123"

#### URL
- `required`: "URL is required"
- `invalid`: "Please enter a valid URL"
- `example`: "e.g., https://example.com"

#### Message
- `required`: "Message is required"
- `tooShort`: "Message must be at least 10 characters"

---

## Migration Guide

### Migrating Existing Forms

If you have an existing form with inline validation, follow these steps:

1. **Import validation functions:**
   ```typescript
   import { validateEmail, validateName } from "@/lib/validations/form-validation";
   ```

2. **Replace inline validation:**
   ```typescript
   // Before
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   if (!emailRegex.test(email)) {
     showError('Invalid email');
   }

   // After
   const emailValidation = validateEmail(email);
   if (!emailValidation.isValid) {
     showError(emailValidation.error!);
   }
   ```

3. **Collect all errors:**
   ```typescript
   const errors = [];

   const nameValidation = validateName(formData.name);
   if (!nameValidation.isValid) errors.push(nameValidation.error!);

   const emailValidation = validateEmail(formData.email);
   if (!emailValidation.isValid) errors.push(emailValidation.error!);

   if (errors.length > 0) {
     showValidationError(errors);
     return;
   }
   ```

4. **Test thoroughly** to ensure validation works as expected.

---

## FAQ

### Q: Should I use strict or lenient phone validation?

**A:** Use strict validation (`strict: true`) for:
- International forms
- API integrations
- Database storage in E.164 format

Use lenient validation (`strict: false`) for:
- User-facing forms where UX is priority
- Forms where you'll normalize the phone number before storage

### Q: How do I validate custom fields?

**A:** For fields not covered by the standard validators, create your own validation function following the same pattern:

```typescript
function validateCustomField(value: string): ValidationResult {
  if (!value.trim()) {
    return { isValid: false, error: 'Field is required' };
  }

  // Your custom validation logic
  if (/* custom check */) {
    return { isValid: false, error: 'Custom error message' };
  }

  return { isValid: true };
}
```

### Q: Can I use these validators on the server-side?

**A:** Yes! The validation utilities are framework-agnostic and can be used in:
- Client-side forms (React components)
- Server-side API routes
- Middleware
- Utility functions

However, for server-side validation, consider using Zod schemas in `/src/lib/validations/api.ts` for more robust type safety.

### Q: How do I customize error messages?

**A:** You can override the error message when displaying to the user:

```typescript
const emailValidation = validateEmail(email);
if (!emailValidation.isValid) {
  // Use custom message instead of default
  showError('Oops! That email doesn\'t look quite right.');
}
```

---

## Support

For questions or issues:
1. Check this guide first
2. Review existing form implementations in `/src/components/`
3. Check `/src/lib/validations/form-validation.ts` for source code
4. Contact the development team

---

## Changelog

### Version 1.0 (2026-01-09)
- Initial release
- Email, phone, name, password, URL, message validation
- Batch validation support
- Comprehensive error messages
- Phone number normalization and formatting helpers
