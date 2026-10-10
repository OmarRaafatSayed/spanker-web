#!/usr/bin/env node

/**
 * Automated Avatars Bucket Setup
 * Creates bucket and policies via Supabase Management API
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.trim();
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nAdd SUPABASE_SERVICE_ROLE_KEY to .env.local from Supabase Dashboard > Settings > API');
  process.exit(1);
}

const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

console.log('🚀 Creating Avatars Storage Bucket...\n');

// Step 1: Create bucket via Management API
const bucketConfig = {
  name: 'avatars',
  id: 'avatars',
  public: true,
  file_size_limit: 5242880, // 5MB
  allowed_mime_types: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
};

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${projectRef}.supabase.co`,
      port: 443,
      path: `/storage/v1${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(`${res.statusCode}: ${response.message || body}`));
          }
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function createBucket() {
  try {
    console.log('📦 Step 1: Creating bucket...');
    await makeRequest('POST', '/bucket', bucketConfig);
    console.log('✅ Bucket "avatars" created successfully!\n');
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('409')) {
      console.log('ℹ️  Bucket "avatars" already exists\n');
    } else {
      throw error;
    }
  }
}

async function createPolicies() {
  console.log('🔐 Step 2: Setting up storage policies via SQL...\n');
  
  const policies = `
-- Drop existing policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Policy 1: Public read access
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Policy 2: Authenticated users can upload
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Users can update their own files
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Users can delete their own files
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
`;

  console.log('📝 SQL Policies to apply:');
  console.log('   - Public read access');
  console.log('   - Authenticated upload (user folder only)');
  console.log('   - Authenticated update (own files only)');
  console.log('   - Authenticated delete (own files only)\n');
  
  console.log('⚠️  Manual step required:');
  console.log('   1. Go to: ' + SUPABASE_URL + '/project/_/sql');
  console.log('   2. Copy and run the policies from: storage-policies.sql\n');
  
  fs.writeFileSync('storage-policies.sql', policies);
  console.log('✅ Policies saved to: storage-policies.sql\n');
}

async function verify() {
  console.log('🔍 Step 3: Verifying bucket...');
  
  try {
    const buckets = await makeRequest('GET', '/bucket');
    const avatarBucket = buckets.find(b => b.id === 'avatars' || b.name === 'avatars');
    
    if (avatarBucket) {
      console.log('✅ Bucket verified:');
      console.log('   Name:', avatarBucket.name);
      console.log('   Public:', avatarBucket.public);
      console.log('   ID:', avatarBucket.id);
      console.log('\n🎉 SUCCESS! Avatars bucket is ready.\n');
      return true;
    } else {
      console.log('❌ Bucket not found after creation\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return false;
  }
}

async function main() {
  try {
    await createBucket();
    await createPolicies();
    const success = await verify();
    
    if (success) {
      console.log('═══════════════════════════════════════════════════');
      console.log('✅ AVATARS BUCKET SETUP COMPLETE');
      console.log('═══════════════════════════════════════════════════\n');
      console.log('Next steps:');
      console.log('1. Apply policies: Go to Supabase SQL Editor');
      console.log('2. Run: storage-policies.sql');
      console.log('3. Test: node run-profile-test.js\n');
    }
    
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.error('2. Verify project URL is correct');
    console.error('3. Try creating bucket manually in Dashboard\n');
    process.exit(1);
  }
}

main();
