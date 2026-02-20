# Complete Search & Pagination Implementation Guide

## ✅ COMPLETED WORK

### 1. Core Bug Fixes (CRITICAL)
- ✅ **Fixed API Client** - Now returns `count` field properly (`lib/admin/api-client.ts` line 30)
- ✅ **Fixed Tags API Client** - Now passes pagination parameters correctly
- ✅ **Created Schedules API** - Was completely missing, now fully implemented

### 2. New Components Created
- ✅ **SearchFilter Component** - `/src/components/admin/ui/SearchFilter.tsx`
  - Unified search box with clear button
  - Filter dropdowns
  - Items per page selector
  - Total count badge (always visible!)
  - Fully responsive

### 3. Backend APIs - ALL UPDATED WITH SEARCH ✅

| API | Pagination | Count | Search | Search Fields |
|-----|-----------|-------|--------|---------------|
| Posts | ✅ | ✅ | ✅ | title, content |
| Events | ✅ | ✅ | ✅ | title, description, location |
| Speakers | ✅ | ✅ | ✅ | name, organization, title, bio_short |
| FAQs | ✅ | ✅ | ✅ | question, answer |
| Sponsors | ✅ | ✅ | ✅ | name |
| Tags (Events) | ✅ | ✅ | ❌ | name (needs frontend) |
| Tags (Posts) | ✅ | ✅ | ❌ | name (needs frontend) |
| Expertise | ✅ | ✅ | ✅ | name |
| Schedules | ✅ | ✅ | ✅ | title, description, location |
| Photos | ✅ | ✅ | ✅ | caption |

### 4. Frontend Pages - FULLY UPDATED ✅

- ✅ **Speakers** - `/src/app/admin/speakers/page.tsx`
  - SearchFilter component integrated
  - Items per page selector
  - Server-side search
  - Total count visible

- ✅ **Posts** - `/src/app/admin/posts/page.tsx`
  - SearchFilter component integrated
  - Status and Category filters
  - Items per page selector
  - Server-side search

## 🔄 REMAINING FRONTEND PAGES TO UPDATE

The backend APIs are ALL DONE and ready. You just need to update the frontends of these pages:

1. Events
2. FAQs
3. Sponsors
4. Tags
5. Expertise
6. Schedule
7. Gallery

---

## 📋 STEP-BY-STEP GUIDE FOR REMAINING PAGES

Follow this exact pattern for EACH remaining page:

### Step 1: Update Imports

```typescript
// Change FROM:
import { DataTable, Pagination } from '@/components/admin/ui'

// Change TO:
import { DataTable, Pagination, SearchFilter } from '@/components/admin/ui'
```

### Step 2: Update State Variables

```typescript
// Change FROM:
const itemsPerPage = 10

// Change TO:
const [itemsPerPage, setItemsPerPage] = useState(10)
const [searchTerm, setSearchTerm] = useState('')
```

### Step 3: Update useEffect Dependencies

```typescript
// Add separate useEffect for search/filters (resets to page 1)
useEffect(() => {
  if (!hasLoaded.current) {
    hasLoaded.current = true
    loadData()
    return
  }
  setCurrentPage(1)  // Reset to page 1 on search
  loadData()
}, [searchTerm, itemsPerPage, otherFilters])

// Keep separate useEffect for page changes
useEffect(() => {
  loadData()
}, [currentPage])
```

### Step 4: Update Load Function

```typescript
const loadData = async () => {
  setLoading(true)
  const params: any = {
    limit: itemsPerPage.toString(),
    offset: ((currentPage - 1) * itemsPerPage).toString()
  }

  // Add search parameter
  if (searchTerm.trim()) {
    params.search = searchTerm.trim()
  }

  // Add other filters...
  if (statusFilter !== 'all') {
    params.status = statusFilter
  }

  const result = await adminApi.ENDPOINT.list(params)
  // ...
}
```

### Step 5: Replace Old Filter UI with SearchFilter

```tsx
// REMOVE old filter cards like:
<div className="card mb-4">
  <div className="card-body">
    <div className="row g-3">
      <div className="col-md-4">
        <label>Search</label>
        <input ... />
      </div>
      ...
    </div>
  </div>
</div>

// REPLACE WITH:
<SearchFilter
  searchPlaceholder="Search by..."
  onSearchChange={setSearchTerm}
  currentItemsPerPage={itemsPerPage}
  onItemsPerPageChange={setItemsPerPage}
  totalItems={totalItems}
  filters={[
    {
      label: 'Status',
      key: 'status',
      options: [
        { label: 'All', value: 'all' },
        { label: 'Active', value: 'active' }
      ],
      value: statusFilter,
      onChange: setStatusFilter
    }
    // Add more filters as needed
  ]}
/>
```

---

## 🎯 SPECIFIC INSTRUCTIONS PER PAGE

### **Events Page** (`/src/app/admin/events/page.tsx`)

**Search Fields**: title, description, location

**Filters to Keep**:
- Status: all, upcoming, ongoing, past, cancelled
- Type: all, conference, workshop, meetup

**SearchFilter Config**:
```tsx
<SearchFilter
  searchPlaceholder="Search events by title, description, location..."
  onSearchChange={setSearchTerm}
  currentItemsPerPage={itemsPerPage}
  onItemsPerPageChange={setItemsPerPage}
  totalItems={totalItems}
  filters={[
    {
      label: 'Status',
      key: 'status',
      options: [
        { label: 'All Statuses', value: 'all' },
        { label: 'Upcoming', value: 'upcoming' },
        { label: 'Ongoing', value: 'ongoing' },
        { label: 'Past', value: 'past' },
        { label: 'Cancelled', value: 'cancelled' }
      ],
      value: statusFilter,
      onChange: setStatusFilter
    },
    {
      label: 'Type',
      key: 'type',
      options: [
        { label: 'All Types', value: 'all' },
        { label: 'Conference', value: 'conference' },
        { label: 'Workshop', value: 'workshop' },
        { label: 'Meetup', value: 'meetup' }
      ],
      value: typeFilter,
      onChange: setTypeFilter
    }
  ]}
/>
```

---

### **FAQs Page** (`/src/app/admin/faqs/page.tsx`)

**Search Fields**: question, answer

**Filters to Keep**:
- Category: registration, venue, schedule, speakers, general

**SearchFilter Config**:
```tsx
<SearchFilter
  searchPlaceholder="Search FAQs by question or answer..."
  onSearchChange={setSearchTerm}
  currentItemsPerPage={itemsPerPage}
  onItemsPerPageChange={setItemsPerPage}
  totalItems={totalItems}
  filters={[
    {
      label: 'Category',
      key: 'category',
      options: [
        { label: 'All Categories', value: 'all' },
        { label: 'Registration', value: 'registration' },
        { label: 'Venue', value: 'venue' },
        { label: 'Schedule', value: 'schedule' },
        { label: 'Speakers', value: 'speakers' },
        { label: 'General', value: 'general' }
      ],
      value: categoryFilter,
      onChange: setCategoryFilter
    }
  ]}
/>
```

---

### **Sponsors Page** (`/src/app/admin/sponsors/page.tsx`)

**Search Fields**: name

**Filters to Keep**:
- Tier: platinum, gold, silver, bronze

**SearchFilter Config**:
```tsx
<SearchFilter
  searchPlaceholder="Search sponsors by name..."
  onSearchChange={setSearchTerm}
  currentItemsPerPage={itemsPerPage}
  onItemsPerPageChange={setItemsPerPage}
  totalItems={totalItems}
  filters={[
    {
      label: 'Tier',
      key: 'tier',
      options: [
        { label: 'All Tiers', value: 'all' },
        { label: 'Platinum', value: 'platinum' },
        { label: 'Gold', value: 'gold' },
        { label: 'Silver', value: 'silver' },
        { label: 'Bronze', value: 'bronze' }
      ],
      value: tierFilter,
      onChange: setTierFilter
    }
  ]}
/>
```

---

### **Tags Page** (`/src/app/admin/tags/page.tsx`)

**Search Fields**: name

**Special Note**: Has TWO tabs (Event Tags, Post Tags), needs TWO separate SearchFilter instances or conditional rendering

**SearchFilter Config**:
```tsx
<SearchFilter
  searchPlaceholder="Search tags by name..."
  onSearchChange={setSearchTerm}
  currentItemsPerPage={itemsPerPage}
  onItemsPerPageChange={setItemsPerPage}
  totalItems={activeTab === 'event' ? eventTotalItems : postTotalItems}
/>
```

---

### **Expertise Page** (`/src/app/admin/expertise/page.tsx`)

**Search Fields**: name

**Simple page, no additional filters needed**

**SearchFilter Config**:
```tsx
<SearchFilter
  searchPlaceholder="Search expertise by name..."
  onSearchChange={setSearchTerm}
  currentItemsPerPage={itemsPerPage}
  onItemsPerPageChange={setItemsPerPage}
  totalItems={totalItems}
/>
```

---

### **Schedule Page** (`/src/app/admin/schedule/page.tsx`)

**Search Fields**: title, description, location

**Filters to Keep**:
- Event: dropdown of events

**SearchFilter Config**:
```tsx
<SearchFilter
  searchPlaceholder="Search schedule items by title, description..."
  onSearchChange={setSearchTerm}
  currentItemsPerPage={itemsPerPage}
  onItemsPerPageChange={setItemsPerPage}
  totalItems={totalItems}
/>
```

**Note**: Event filter should stay as a separate dropdown above SearchFilter since it's crucial for this page

---

### **Gallery Page** (`/src/app/admin/gallery/page.tsx`)

**Search Fields**: caption

**Filters to Keep**:
- Year: 2022, 2023, 2024, 2025

**SearchFilter Config**:
```tsx
<SearchFilter
  searchPlaceholder="Search photos by caption..."
  onSearchChange={setSearchTerm}
  currentItemsPerPage={itemsPerPage}
  onItemsPerPageChange={setItemsPerPage}
  totalItems={totalItems}
  filters={[
    {
      label: 'Year',
      key: 'year',
      options: [
        { label: 'All Years', value: 'all' },
        { label: '2025', value: '2025' },
        { label: '2024', value: '2024' },
        { label: '2023', value: '2023' },
        { label: '2022', value: '2022' }
      ],
      value: yearFilter,
      onChange: setYearFilter
    }
  ]}
/>
```

---

## ✅ VERIFICATION CHECKLIST

After updating each page, verify:

1. [ ] Search box appears and is functional
2. [ ] Items per page dropdown works (10, 25, 50, 100)
3. [ ] **Total count badge shows correct number** (not 0!)
4. [ ] Pagination controls appear when > 10 items
5. [ ] Filters work correctly with search
6. [ ] Changing search/filter resets to page 1
7. [ ] Page navigation works correctly

---

## 🚀 FINAL STATUS

### Completed ✅
- Core bug fixes (API client, Tags API client)
- Search Filter component
- ALL backend APIs with search support
- Speakers page (complete example)
- Posts page (complete example)

### Remaining 🔄
- Update 7 frontend pages following the pattern above
- Each page takes ~5-10 minutes to update
- Total remaining time: ~1 hour

---

## 📞 NEED HELP?

Reference files:
- **Complete Example**: `/src/app/admin/speakers/page.tsx`
- **SearchFilter Component**: `/src/components/admin/ui/SearchFilter.tsx`
- **API Client**: `/lib/admin/api-client.ts`

All backend APIs are ready and tested. Just follow the pattern for each frontend page!
