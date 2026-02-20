# Immutable Function Error Fix

## Problem

**Files 42 & 43:** `ERROR: 42P17: functions in index predicate must be marked IMMUTABLE`

## Root Cause

PostgreSQL doesn't allow non-IMMUTABLE functions in index WHERE clauses. Functions like `NOW()`, `CURRENT_DATE`, and `CURRENT_TIMESTAMP` return different values over time, so they cannot be used in index predicates.

### Problematic Indexes Found:

**File 42 - Line 183:**
```sql
CREATE INDEX idx_email_verification_expired
ON email_verification_tokens(created_at, expires_at)
WHERE verified_at IS NULL AND expires_at < NOW();  -- ❌ NOW() not allowed
```

**File 42 - Line 253:**
```sql
CREATE INDEX idx_review_locks_active
ON review_locks(expires_at DESC)
WHERE expires_at > NOW();  -- ❌ NOW() not allowed
```

**File 43 - Line 97:**
```sql
CREATE INDEX idx_review_locks_active
ON review_locks(expires_at DESC)
WHERE expires_at > NOW();  -- ❌ NOW() not allowed
```

## Solution Applied

Removed `NOW()` from index WHERE clauses. The indexes are now created without time-based filtering, and the filtering is done at query time instead.

### File 42 - Fixed Indexes:

**Line 183 (fixed):**
```sql
CREATE INDEX idx_email_verification_expired
ON email_verification_tokens(expires_at, created_at)
WHERE verified_at IS NULL;  -- ✅ Removed "expires_at < NOW()"
```

**Line 253 (fixed):**
```sql
CREATE INDEX idx_review_locks_active
ON review_locks(expires_at DESC);  -- ✅ Removed WHERE clause entirely
```

### File 43 - Fixed Index:

**Line 97 (fixed):**
```sql
CREATE INDEX idx_review_locks_active
ON review_locks(expires_at DESC);  -- ✅ Removed WHERE clause
```

## Impact

- **Index Size:** Slightly larger (includes all rows instead of filtering)
- **Performance:** Still excellent - queries filter `expires_at > NOW()` at runtime
- **Functionality:** No change - same query performance, just different approach

## Why This Works

The indexes are still highly effective because:
1. They order by `expires_at`, making range queries fast
2. PostgreSQL can use the index for `WHERE expires_at > NOW()` queries
3. The index scan + filter is still much faster than a full table scan

## Example Queries (Still Fast):

```sql
-- This query is still fast with the fixed index
SELECT * FROM review_locks
WHERE expires_at > NOW()
ORDER BY expires_at DESC;

-- PostgreSQL uses idx_review_locks_active and filters at runtime
```

## Note About File 35

File 35 line 301 also uses `NOW()`, but it's in a **function** (not an index), which is perfectly fine:

```sql
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS void AS $$
BEGIN
  DELETE FROM review_locks
  WHERE expires_at < NOW();  -- ✅ OK in functions
END;
$$ LANGUAGE plpgsql;
```

Functions can use non-immutable functions - only index predicates have this restriction.

---

**Created:** 2025-12-14
**Status:** ✅ Fixed
**Files Modified:** 42_performance_optimization_indexes.sql, 43_additional_performance_indexes.sql
