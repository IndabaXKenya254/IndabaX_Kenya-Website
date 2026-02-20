# Sauti Yetu - External Blog Links Feature

## Overview

**Sauti Yetu** (Swahili for "Our Voice") is a feature that allows you to showcase external articles and blog posts from other websites (like deeplearningindaba.com) on your IndabaX Kenya news page. These posts appear as regular news cards but link directly to the external source.

## How It Works

### For Visitors (Public News Page)

1. **Viewing Posts**: On the `/news` page, visitors see both regular IndabaX Kenya articles and Sauti Yetu external links
2. **Visual Distinction**: Sauti Yetu posts have:
   - An "External" badge on the card image
   - A globe icon with the source name (e.g., "Deep Learning Indaba")
   - An external link icon next to the title
   - Blue-tinted border styling
3. **Clicking**: Clicking a Sauti Yetu card opens the external article in a new browser tab
4. **Filtering**: Use the "Post Type" dropdown to filter:
   - **All Types**: Shows both regular and Sauti Yetu posts
   - **IndabaX Kenya Articles**: Shows only internal posts
   - **Sauti Yetu (External Links)**: Shows only external article links

### For Admins (Creating Sauti Yetu Posts)

#### Step 1: Go to Admin Posts

Navigate to **Admin Panel → Posts → Create New Post**

#### Step 2: Select Post Type

At the top of the form, you'll see a **Post Type** selector:
- **Normal Post**: Regular blog post with full content (default)
- **Sauti Yetu (External Link)**: Links to an external article

Select **"Sauti Yetu (External Link)"**

#### Step 3: Enter External URL

1. Paste the full URL of the external article (e.g., `https://deeplearningindaba.com/2024/12/some-article/`)
2. Click the **"Fetch Preview"** button
3. The system will automatically fetch:
   - **Title**: From the article's Open Graph (og:title) or page title
   - **Description**: From og:description or meta description
   - **Preview Image**: From og:image

#### Step 4: Review and Adjust

After fetching, review the auto-filled fields:
- **Title**: Edit if needed (this appears on your news card)
- **Excerpt**: The description fetched from the article
- **OG Image URL**: The preview image URL (auto-filled)
- **Source Name**: Enter the source (e.g., "Deep Learning Indaba", "AI News", etc.)

#### Step 5: Set Category and Status

1. Select a **Category** (News, Announcement, etc.)
2. Set **Status** to "Published" when ready
3. The **Published At** date will be set automatically

#### Step 6: Save

Click **"Create Post"** to save your Sauti Yetu post.

## Example Workflow

**Scenario**: You want to share an article from Deep Learning Indaba's website on your news page.

1. Find the article URL: `https://deeplearningindaba.com/2024/12/exciting-news/`
2. Go to Admin → Posts → Create New
3. Select "Sauti Yetu (External Link)"
4. Paste URL and click "Fetch Preview"
5. Review: Title shows "Exciting News from Indaba"
6. Set Source Name: "Deep Learning Indaba"
7. Category: "News"
8. Status: "Published"
9. Click "Create Post"

**Result**: The article now appears on your `/news` page with proper styling, and clicking it takes visitors directly to the original article.

## Managing Sauti Yetu Posts

### Viewing All Sauti Yetu Posts

In **Admin → Posts**, use the **Post Type** filter dropdown and select "Sauti Yetu" to see only external link posts.

### Editing a Sauti Yetu Post

1. Click on any Sauti Yetu post to edit
2. You can:
   - Change the title or excerpt
   - Update the external URL (and re-fetch preview)
   - Change the source name
   - Update the category or status

### Converting Post Types

- **Normal → Sauti Yetu**: Change the post type, add external URL, fetch preview
- **Sauti Yetu → Normal**: Change post type back to "Normal", the external URL fields will be hidden (but data preserved)

## Technical Details

### Database Fields

The posts table includes these Sauti Yetu-specific columns:
- `post_type`: 'normal' or 'sauti_yetu'
- `external_url`: The full URL to the external article
- `og_image`: URL of the preview image from the external site
- `source_name`: Display name of the source website

### API Endpoint

The OG metadata fetch endpoint:
```
POST /api/admin/fetch-og
Body: { "url": "https://example.com/article" }
Response: { "success": true, "data": { "title", "description", "image", "siteName" } }
```

### Styling

Sauti Yetu cards use the `.sauti-yetu-card` CSS class with:
- Info-blue border color (#17a2b8)
- External link badges
- Globe icon for source attribution

## Troubleshooting

### "Fetch Preview" Returns Empty Data

Some websites block Open Graph fetching. In this case:
1. Manually enter the title
2. Copy the description from the article
3. Right-click the article's image → "Copy Image Address" → paste as OG Image URL
4. Enter the source name manually

### External Link Not Working

Ensure:
1. The URL includes the full protocol (https://)
2. The URL is publicly accessible (not behind a paywall or login)
3. The post status is "Published"

### Posts Not Showing in Filter

1. Check that the post has `post_type: 'sauti_yetu'` in the database
2. Ensure the post is published (status = 'published')
3. Ensure it has a `published_at` date

## Best Practices

1. **Credit Sources**: Always set a clear source name
2. **Verify Links**: Test external links before publishing
3. **Use Quality Images**: If the fetched image is low quality, find a better one
4. **Write Clear Titles**: Edit titles to be clear for your audience
5. **Keep Excerpts Concise**: Trim long descriptions to 2-3 sentences
6. **Categorize Properly**: Use appropriate categories for discoverability

---

*Sauti Yetu - Amplifying African AI voices through shared knowledge*
