# Review Lock System - User Guide

## Overview

The review lock system prevents multiple admins from reviewing the same application at the same time, avoiding conflicts and duplicate work.

---

## How It Works

### 1. **Automatic Lock Acquisition**
- When you open an application detail page, a **30-minute lock** is automatically acquired
- You'll see a countdown timer showing remaining time
- Only you can edit/review this application while you have the lock

### 2. **Lock Duration**
- Initial lock: **30 minutes**
- Auto-extend: Every **20 minutes** (if `autoExtend: true`)
- You can manually extend at any time by clicking **"Extend Lock"**

### 3. **What the Timer Shows**
```
Lock expires in: 29:45
```
- Format: `MM:SS` (minutes:seconds)
- Updates every second
- Turns orange/red when < 5 minutes remaining (optional UI enhancement)

---

## What Happens When Timer Expires?

### ⏱️ When Lock Expires (Timer reaches 0:00):

1. **Lock is automatically released** from the database
2. **Warning alert appears**:
   > "Your review lock has expired after 30 minutes of inactivity. Click 'Acquire Lock' to continue reviewing, or refresh the page."
3. **Your unsaved changes are at risk** - Save notes before lock expires!
4. **Application becomes available** for other admins to review
5. **You can no longer save changes** until you re-acquire the lock

---

## How to Continue Reviewing After Expiry

### Option 1: Click "Acquire Lock" Button (Recommended)
1. Look for the lock indicator panel
2. Click the **"Acquire Lock"** button
3. If no one else has taken the lock, you'll immediately get a new 30-minute session
4. If someone else has the lock, you'll see who is reviewing it

### Option 2: Refresh the Page
1. Press `F5` or click the browser refresh button
2. The page will auto-acquire the lock on reload (if available)
3. **Warning**: Any unsaved notes will be lost!

### Option 3: Extend Before Expiry (Best Practice)
1. Watch the countdown timer
2. When you have **5-10 minutes remaining**, click **"Extend Lock"**
3. Timer resets to 30:00
4. Continue reviewing without interruption

---

## Best Practices

### ✅ DO:
- **Extend early**: Don't wait until the last minute - extend when you have 5-10 minutes left
- **Save often**: Save review notes frequently (auto-save coming in future phase)
- **Use "Extend Lock"**: If you need more time, extend rather than letting it expire
- **Monitor the timer**: Keep an eye on the countdown, especially for complex reviews

### ❌ DON'T:
- Let the lock expire if you're still reviewing (you'll lose your work!)
- Try to review without a lock (save buttons will be disabled)
- Ignore the expiry warning (re-acquire immediately if you see it)
- Leave the page open idle for > 30 minutes without extending

---

## Lock States

### 🔓 **No Lock (Unlocked)**
```
Status: Unlocked
[Acquire Lock] button visible
```
- Application is available for review
- Click "Acquire Lock" to start reviewing
- Save buttons are disabled

### 🔒 **You Have the Lock**
```
Status: Locked by you
Lock expires in: 29:45
[Extend Lock] [Release Lock] buttons visible
```
- You can edit and save changes
- Timer counts down from 30:00
- Automatically extends every 20 minutes (if autoExtend enabled)
- Release manually when done reviewing

### 🔐 **Locked by Another Admin**
```
Status: Locked by admin@example.com
Lock expires in: 15:30
```
- Someone else is reviewing this application
- You cannot acquire the lock until they release it or it expires
- Wait for the lock to expire, or contact the other admin

---

## Troubleshooting

### Problem: "Lock expired" warning appears
**Solution**: Click "Acquire Lock" button to get a new 30-minute session

### Problem: Can't acquire lock (locked by someone else)
**Solution**:
- Wait for their lock to expire (check the timer)
- Contact the other admin to see if they're done
- Admin can force-unlock if necessary (use with caution!)

### Problem: Timer shows wrong time
**Solution**:
- Refresh the page
- Check your system clock is correct
- Check server time (database timestamps)

### Problem: Lost my review notes when lock expired
**Solution**:
- Unfortunately, unsaved notes are lost
- Prevention: Save notes regularly, extend lock before expiry
- Future enhancement: Auto-save every 60 seconds

### Problem: Lock won't release
**Solution**:
- Try clicking "Release Lock" again
- Refresh the page
- Contact admin for force-unlock
- Lock will auto-expire after 30 minutes

---

## Technical Details

### Database Function: `acquire_review_lock()`
- Creates or extends a lock in the `review_locks` table
- Lock duration: configurable (default 30 minutes)
- Returns: `success`, `message`, `lock_id`, `expires_at`

### Automatic Cleanup
- Expired locks are automatically deleted
- Runs before checking lock status
- Database function: `cleanup_expired_locks()`

### Lock Extension
- Calling `acquireLock()` on an existing lock extends it
- Updates `expires_at` to NOW() + 30 minutes
- Updates `locked_at` to NOW()
- Same as acquiring a new lock

---

## Future Enhancements

### Coming Soon:
- ⏰ **Auto-save**: Save notes every 60 seconds
- 🔔 **Expiry warnings**: Alert at 5 minutes, 2 minutes, 1 minute
- 📊 **Lock history**: See who reviewed when
- 🔄 **Lock stealing**: Admin can take over a lock with reason
- 📱 **Mobile notifications**: Get notified before lock expires
- 🎨 **Visual countdown**: Progress bar showing time remaining
- 💾 **Draft recovery**: Recover unsaved notes if lock expires

---

## Summary

**When lock expires:**
1. Warning alert appears
2. Click "Acquire Lock" to continue
3. If locked by someone else, wait or contact them
4. Best practice: Extend before expiry!

**Lock duration:**
- Initial: 30 minutes
- Extend: Adds another 30 minutes
- Auto-extend: Every 20 minutes (optional)

**What to do:**
- ✅ Extend early (at 5-10 minutes remaining)
- ✅ Save notes frequently
- ✅ Monitor the countdown timer
- ❌ Don't let it expire while reviewing
