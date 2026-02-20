/**
 * Upload Homepage Images to Supabase Storage
 * Run with: node scripts/upload-homepage-images.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Check .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKET = 'event-images';

const imagesToUpload = [
  {
    localPath: 'public/images/main-bg1.jpg',
    storagePath: 'homepage/hero-background.jpg',
    settingKey: 'hero_background_image'
  },
  {
    localPath: 'public/images/about1.jpg',
    storagePath: 'homepage/about-image1.jpg',
    settingKey: 'about_image1'
  },
  {
    localPath: 'public/images/about2.jpg',
    storagePath: 'homepage/about-image2.jpg',
    settingKey: 'about_image2'
  }
];

async function uploadImage(localPath, storagePath) {
  const fullPath = path.join(process.cwd(), localPath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }

  const fileBuffer = fs.readFileSync(fullPath);
  const contentType = 'image/jpeg';

  // Upload to storage
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true // Overwrite if exists
    });

  if (error) {
    throw error;
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storagePath);

  return urlData.publicUrl;
}

async function updateSetting(key, value) {
  const { error } = await supabase
    .from('settings')
    .update({ value: value, updated_at: new Date().toISOString() })
    .eq('key', key);

  if (error) {
    // Try insert if update fails (record doesn't exist)
    const { error: insertError } = await supabase
      .from('settings')
      .insert({ key, value, updated_at: new Date().toISOString() });

    if (insertError) {
      throw insertError;
    }
  }
}

async function main() {
  console.log('Starting homepage image upload...\n');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Bucket: ${BUCKET}\n`);

  const results = [];

  for (const image of imagesToUpload) {
    try {
      console.log(`Uploading ${image.localPath}...`);
      const publicUrl = await uploadImage(image.localPath, image.storagePath);
      console.log(`  Uploaded to: ${publicUrl}`);

      console.log(`  Updating setting: ${image.settingKey}`);
      await updateSetting(image.settingKey, publicUrl);
      console.log(`  Setting updated!\n`);

      results.push({ key: image.settingKey, url: publicUrl, success: true });
    } catch (error) {
      console.error(`  Error: ${error.message}\n`);
      results.push({ key: image.settingKey, error: error.message, success: false });
    }
  }

  console.log('\n=== Summary ===');
  results.forEach(r => {
    if (r.success) {
      console.log(`✓ ${r.key}: ${r.url}`);
    } else {
      console.log(`✗ ${r.key}: ${r.error}`);
    }
  });

  // Verify settings were updated
  console.log('\n=== Verifying Database Settings ===');
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['hero_background_image', 'about_image1', 'about_image2']);

  if (settings) {
    settings.forEach(s => {
      console.log(`${s.key}: ${s.value}`);
    });
  }
}

main().catch(console.error);
