# Verification Scripts

There are **two versions** of the verification script:

## 1. verification.sql (psql version)
- **For**: PostgreSQL command-line tool (psql)
- **Contains**: `\echo` meta-commands for nice formatting
- **Use when**: Running from terminal with psql

```bash
psql "postgresql://postgres:[password]@[host]:5432/postgres" -f verification.sql
```

## 2. verification_supabase.sql (Supabase SQL Editor version) ⭐
- **For**: Supabase SQL Editor (Dashboard)
- **Contains**: Pure SQL only (no psql commands)
- **Use when**: Running in Supabase Dashboard → SQL Editor

### How to Use in Supabase:

1. Go to your Supabase project
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy/paste the contents of `verification_supabase.sql`
5. Click **Run**
6. Review all test results

---

## Why Two Versions?

The original `verification.sql` uses `\echo` commands which are **psql meta-commands**. These only work in the PostgreSQL command-line tool (psql), not in web-based SQL editors.

The error you saw:
```
ERROR: 42601: syntax error at or near "\"
LINE 8: \echo '========================================='
```

This happens because Supabase SQL Editor doesn't recognize `\echo` as valid SQL.

---

## Quick Reference

| Feature | verification.sql | verification_supabase.sql |
|---------|-----------------|---------------------------|
| Works in Supabase Dashboard | ❌ | ✅ |
| Works with psql CLI | ✅ | ✅ |
| Nice formatting | ✅ Better | ✅ Good |
| Pure SQL | ❌ | ✅ |

**Recommendation**: Use **`verification_supabase.sql`** for Supabase Dashboard ⭐
