# Image Banners Guide - Events & Blog Posts

## Overview
This guide provides recommended images, search queries, and sources for finding appropriate banners for the 4 past events and 3 blog posts.

---

## Free Stock Photo Sources

### Recommended Sites (CC0 - Free for commercial use)
1. **Unsplash** - https://unsplash.com
2. **Pexels** - https://pexels.com
3. **Pixabay** - https://pixabay.com
4. **Freepik** - https://freepik.com (some require attribution)

### African-Focused Image Sources
1. **Nappy** - https://nappy.co (Black and Brown people)
2. **Create Her Stock** - https://createherstock.com
3. **WOCinTech Chat** - https://www.flickr.com/photos/wocintechchat

---

## EVENT BANNERS

### 1. IndabaX Kenya 2022 - AI for Smart Cities
**Theme:** Urban planning, smart cities, technology in African cities

**Recommended Image Type:**
- Nairobi skyline with technology overlay
- Modern African city with digital elements
- Smart city concepts with African context
- Strathmore University campus (if available)

**Search Queries:**
- "Nairobi skyline technology"
- "African smart city"
- "Urban planning Kenya"
- "Modern African city digital"
- "Technology conference Kenya"

**Suggested Colors:** Blue, white, tech-themed
**Aspect Ratio:** 16:9 (1920x1080)

---

### 2. IndabaX Kenya 2023 - Innovation Through Collaboration
**Theme:** Hackathon, collaboration, teamwork, innovation

**Recommended Image Type:**
- Diverse team collaborating on laptops
- African students in computer lab
- Hackathon scene with multiple people
- Group brainstorming with laptops and sticky notes

**Search Queries:**
- "African students coding"
- "Hackathon team Africa"
- "Collaborative programming"
- "African tech team"
- "University computer lab Kenya"

**Suggested Colors:** Orange, purple, energetic tones
**Aspect Ratio:** 16:9 (1920x1080)

---

### 3. IndabaX Kenya 2024 - Blue Economy
**Theme:** Ocean, marine science, AI for fisheries, coastal conservation

**Recommended Image Type:**
- Kenyan coastline/ocean
- Fishermen with technology
- Marine conservation scene
- Satellite imagery of coastal areas
- Underwater scene or coral reef

**Search Queries:**
- "Kenya coastline"
- "Indian ocean Africa"
- "Fishermen Kenya"
- "Marine conservation Africa"
- "Coastal ecosystem"
- "Ocean technology"

**Suggested Colors:** Blue, turquoise, ocean tones
**Aspect Ratio:** 16:9 (1920x1080)

---

### 4. IndabaX Kenya 2025 - Politics and Democracy
**Theme:** Democracy, governance, electoral systems, civic tech

**Recommended Image Type:**
- Voting/electoral imagery
- Kenyan flag with technology elements
- Democratic symbols
- People engaging in civic activities
- Parliament/government buildings

**Search Queries:**
- "Democracy Africa"
- "Voting Kenya"
- "Civic engagement technology"
- "African governance"
- "Electoral system"
- "Democratic participation"

**Suggested Colors:** Red, green, black (Kenyan flag colors)
**Aspect Ratio:** 16:9 (1920x1080)

---

## BLOG POST BANNERS

### 1. The Rise of AI Research in Africa
**Theme:** Research, innovation, African scientists, growth, technology

**Recommended Image Type:**
- African researcher/scientist with laptop/lab equipment
- Map of Africa with technology overlay
- University research setting
- Data visualization with African context

**Search Queries:**
- "African scientist technology"
- "AI research Africa"
- "African innovation"
- "Technology research Africa"
- "Data science Africa"
- "African university research"

**Suggested Colors:** Purple, gold, academic tones
**Aspect Ratio:** 16:9 (1200x675) or 4:3 (1200x900)

---

### 2. African AI Startups: Innovating for Impact
**Theme:** Entrepreneurship, startups, innovation, impact

**Recommended Image Type:**
- African entrepreneurs in modern office
- Startup team meeting
- Innovation hub/co-working space
- Mobile technology in African setting
- Tech product demo

**Search Queries:**
- "African tech startup"
- "African entrepreneurs technology"
- "Innovation hub Africa"
- "Tech company Africa"
- "African business technology"
- "Startup team Africa"

**Suggested Colors:** Vibrant, modern, startup-themed
**Aspect Ratio:** 16:9 (1200x675) or 4:3 (1200x900)

---

### 3. Building Kenya's AI Future: Education
**Theme:** Education, students, learning, community, capacity building

**Recommended Image Type:**
- Kenyan students in classroom/computer lab
- Teacher instructing on computers
- University campus scene
- Study group/collaborative learning
- Young people with laptops

**Search Queries:**
- "Kenya students technology"
- "African education technology"
- "Computer education Kenya"
- "University students Africa"
- "Technology training Africa"
- "Digital literacy Kenya"

**Suggested Colors:** Green, white, educational tones
**Aspect Ratio:** 16:9 (1200x675) or 4:3 (1200x900)

---

## IMPLEMENTATION STEPS

### Step 1: Download Images
1. Search for images using the queries above
2. Download high-resolution versions (minimum 1200px wide)
3. Ensure images are properly licensed (CC0 or purchased)
4. Rename files descriptively:
   - `indabax-2022-smart-cities.jpg`
   - `indabax-2023-hackathon.jpg`
   - `indabax-2024-blue-economy.jpg`
   - `indabax-2025-democracy.jpg`
   - `blog-ai-research-africa.jpg`
   - `blog-ai-startups-africa.jpg`
   - `blog-kenya-ai-education.jpg`

### Step 2: Optimize Images
Use an image optimizer before uploading:
- **Online:** TinyPNG, Squoosh.app, ImageOptim
- **CLI:** `npm install -g sharp-cli` then `sharp -i input.jpg -o output.jpg`
- **Target size:** Under 500KB each
- **Format:** JPEG for photos, WebP for better compression

### Step 3: Upload to Supabase Storage

**Option A: Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to Storage
4. Create bucket `event-images` (if not exists)
5. Upload the 7 images

**Option B: Using CLI/Code**
```javascript
// Example upload script
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function uploadImages() {
  const images = [
    { path: 'events/indabax-2022-smart-cities.jpg', file: './images/indabax-2022.jpg' },
    { path: 'events/indabax-2023-hackathon.jpg', file: './images/indabax-2023.jpg' },
    // ... add all images
  ]

  for (const img of images) {
    const { data, error } = await supabase.storage
      .from('event-images')
      .upload(img.path, fs.readFileSync(img.file))

    if (error) console.error('Error:', error)
    else console.log('Uploaded:', img.path)
  }
}
```

### Step 4: Get Public URLs
After uploading, get the public URLs:
```javascript
const { data } = supabase.storage
  .from('event-images')
  .getPublicUrl('events/indabax-2022-smart-cities.jpg')

console.log(data.publicUrl)
// Example: https://[project-ref].supabase.co/storage/v1/object/public/event-images/events/indabax-2022-smart-cities.jpg
```

### Step 5: Update Database
Run the migration to add image URLs to events and posts.

---

## ALTERNATIVE: AI-GENERATED IMAGES

If you want custom images, consider:

1. **DALL-E 3** (OpenAI) - High quality, $0.04-0.08 per image
2. **Midjourney** - Artistic, subscription-based
3. **Stable Diffusion** - Free, requires setup

**Sample Prompts:**

**IndabaX 2022:**
"Modern Nairobi skyline with holographic smart city technology overlay, futuristic African urban planning, professional photography, 16:9, vibrant colors"

**IndabaX 2023:**
"Diverse African students collaborating in a hackathon, laptops and code, energetic atmosphere, modern university setting, professional photography"

**IndabaX 2024:**
"Kenyan coastline with AI-powered marine conservation technology, ocean research, blue economy, satellite imagery overlay, professional photography"

**IndabaX 2025:**
"African democratic symbols merged with artificial intelligence, voting and technology, civic engagement, Kenyan flag colors, professional graphic"

**Blog - AI Research:**
"African scientist working with AI algorithms, research laboratory, data visualizations, maps of Africa, academic setting, inspiring"

**Blog - Startups:**
"African tech entrepreneurs in modern startup office, innovation hub, mobile technology, dynamic team, success and growth"

**Blog - Education:**
"Kenyan university students learning AI and programming, computer lab, collaborative learning, bright future, educational technology"

---

## QUICK RECOMMENDATION

If you need images RIGHT NOW, here are the best searches to start with:

1. **Events:** Search "African technology conference" on Unsplash
2. **Blog Posts:** Search "African students coding" on Pexels
3. **General:** Browse "technology africa" collections

These will give you professional, relevant images that fit the IndabaX Kenya brand.

---

## NEXT STEPS

Once you have the images uploaded to Supabase Storage, I can create a migration to update the `featured_image` field for all events and posts with the appropriate URLs.

Let me know when you have the images ready, and I'll prepare the update migration!
