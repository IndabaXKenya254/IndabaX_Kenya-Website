# Architecture Decisions - IndabaX Kenya Website

## Phase 4: Registration Flow

### Decision 1: Authentication-Required Registration

**Date:** November 21, 2025
**Status:** ✅ IMPLEMENTED
**Decision:** All event registrations REQUIRE user authentication

**Context:**
- Initial database design supported both authenticated and guest registration
- Database has `user_id` (nullable) and `resume_token` for guest users
- RLS policies enforce authentication
- Frontend redirects unauthenticated users to login

**Decision Rationale:**
1. **Security:** Authenticated users provide accountability
2. **Data Quality:** Verified email addresses reduce spam
3. **User Experience:** Users can view all their registrations in one dashboard
4. **Admin Management:** Easier to manage and contact registered users
5. **Simplicity:** Single auth flow is easier to maintain

**Implementation:**
- ✅ API enforces authentication (`createServerClient()` with `auth.getUser()`)
- ✅ Frontend redirects to `/login?redirect=/events/[slug]/register`
- ✅ RLS policies require `auth.email()` match
- ✅ Dashboard shows user's registered events

**Guest Registration Features (NOT USED):**
- `resume_token` column - Reserved for future use
- `user_id` nullable - Allows system-created registrations
- Email-based access - Used for admin queries only

**Recommendation:** Keep guest features in database for future flexibility, but **DO NOT enable** without full security review.

---

### Decision 2: Denormalized Form Responses

**Date:** November 20, 2025
**Status:** ✅ IMPLEMENTED
**Decision:** Store form responses as JSONB in `form_responses.responses` column

**Context:**
- Database has both `form_responses` (denormalized) and `form_answers` (normalized) tables
- `form_answers` table exists but is NEVER USED

**Decision Rationale:**
1. **Performance:** Single query to get all answers
2. **Flexibility:** Dynamic forms with varying questions
3. **Simplicity:** Easier to implement auto-save
4. **Compatibility:** JSONB supports complex data types (arrays, objects)

**Implementation:**
```json
{
  "responses": {
    "question-uuid-1": "John Doe",
    "question-uuid-2": "john@example.com",
    "question-uuid-3": ["option1", "option2"]
  }
}
```

**Trade-offs:**
- ✅ **Pro:** Fast retrieval, flexible schema
- ❌ **Con:** Cannot query individual answers with SQL
- ❌ **Con:** No referential integrity on answers

**`form_answers` Table Status:** **UNUSED** - Reserved for future normalized storage if needed

---

### Decision 3: Two Email Accounts

**Date:** November 21, 2025
**Status:** ✅ IMPLEMENTED
**Decision:** Use separate email accounts for different purposes

**Email Accounts:**
1. **applications@deeplearningindabaxkenya.com**
   - Event registrations
   - Application confirmations
   - Participant communications

2. **accounts@deeplearningindabaxkenya.com**
   - User account creation
   - Password resets
   - System notifications
   - Admin communications

**Rationale:**
1. **Organization:** Clear separation of concerns
2. **Filtering:** Easier for recipients to filter emails
3. **Security:** Isolate account-critical emails
4. **Deliverability:** Separate reputations for different email types

**Implementation:**
- ✅ `createApplicationsTransporter()` for event emails
- ✅ `createAccountsTransporter()` for system emails
- ✅ Environment variables for both accounts

---

### Decision 4: Slug-Based Event URLs

**Date:** November 21, 2025
**Status:** ✅ IMPLEMENTED
**Decision:** Use human-readable slugs for event URLs instead of UUIDs

**URLs:**
- ❌ `/events/c4ef9b0b-8076-4210-a08e-b66e0db0c775`
- ✅ `/events/lovely-tides-conference-2025`

**Rationale:**
1. **SEO:** Search engines prefer readable URLs
2. **User Experience:** Users can understand URL content
3. **Sharing:** More shareable on social media
4. **Branding:** Professional appearance

**Implementation:**
- ✅ Events have `slug` column (unique)
- ✅ Registration pages use `/events/[slug]/register`
- ✅ Email links use slugs
- ✅ API queries by slug (`/api/events/[slug]`)

**Internal:** Database still uses UUIDs for relationships

---

### Decision 5: Auto-Save Delay

**Date:** November 21, 2025
**Status:** ✅ IMPLEMENTED
**Decision:** Auto-save form responses every 3 seconds

**Rationale:**
1. **User Experience:** Prevents data loss
2. **Performance:** 3-second delay reduces API calls
3. **Debounce:** Uses debounce to avoid excessive saves
4. **Feedback:** Shows "Saving..." and "Saved X seconds ago"

**Implementation:**
```typescript
const autoSaveDelay = 3000 // milliseconds

useEffect(() => {
  const timeoutId = setTimeout(() => {
    onAutoSave(responses) // Debounced save
  }, autoSaveDelay)
  return () => clearTimeout(timeoutId)
}, [responses])
```

**Alternative Considered:** 1-second delay (rejected - too frequent)

---

### Decision 6: Progress Calculation

**Date:** November 21, 2025
**Status:** ✅ IMPLEMENTED
**Decision:** Calculate progress based on required questions only

**Formula:**
```
progress = (answered_required / total_required) * 100
```

**Rationale:**
1. **Clarity:** Users know what's required to submit
2. **Motivation:** Progress bar encourages completion
3. **Accuracy:** Reflects actual completion status

**Implementation:**
- Only counts `is_required = true` questions
- Empty arrays and null values count as unanswered
- Optional questions don't affect progress

---

## Future Decisions

### Pending: Multi-Stage Registration

**Status:** NOT IMPLEMENTED (Future Phase)

**Design:** Initial interest → Shortlist → Detailed survey → Approval

**Tables Ready:** `registrations` table exists but not used

---

### Pending: GDPR Compliance

**Status:** NOT IMPLEMENTED (Required for EU/EEA)

**Features Needed:**
- Data export (Article 20)
- Right to be forgotten (Article 17)
- Consent tracking
- Privacy policy acceptance

---

## Decision Log

| Date | Decision | Status | Impact |
|------|----------|--------|--------|
| 2025-11-21 | Authentication required | ✅ Implemented | Security improved |
| 2025-11-21 | Denormalized responses | ✅ Implemented | Performance optimized |
| 2025-11-21 | Two email accounts | ✅ Implemented | Better organization |
| 2025-11-21 | Slug-based URLs | ✅ Implemented | SEO improved |
| 2025-11-21 | 3-second auto-save | ✅ Implemented | UX improved |
| 2025-11-21 | Required-only progress | ✅ Implemented | Clarity improved |

---

**Maintained By:** Development Team
**Last Updated:** November 21, 2025
**Version:** 1.0
