/**
 * Script to verify and create customer-documents storage bucket
 * Run with: npx tsx scripts/verify-storage-bucket.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const BUCKET_NAME = 'customer-documents';

async function verifyAndCreateBucket() {
  console.log('🔍 Checking for customer-documents storage bucket...\n');

  try {
    // Create admin client directly (bypasses Next.js cookies context)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing required environment variables:');
      if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL');
      if (!serviceRoleKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
      process.exit(1);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // List all buckets
    const { data: buckets, error: listError } = await adminClient.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      process.exit(1);
    }

    console.log(`📦 Found ${buckets.length} storage bucket(s):`);
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    console.log();

    // Check if customer-documents bucket exists
    const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME);

    if (bucketExists) {
      console.log('✅ customer-documents bucket already exists');
      const bucket = buckets.find(b => b.name === BUCKET_NAME);
      console.log(`   - Privacy: ${bucket?.public ? 'PUBLIC' : 'PRIVATE'}`);
      console.log(`   - Created: ${bucket?.created_at}`);
      console.log('\n✨ Verification complete - no action needed');
      process.exit(0);
    }

    // Bucket doesn't exist - create it
    console.log('⚠️  customer-documents bucket NOT found');
    console.log('📝 Creating bucket...\n');

    const { data: newBucket, error: createError } = await adminClient.storage.createBucket(
      BUCKET_NAME,
      {
        public: false, // Private bucket for security
        fileSizeLimit: 10485760, // 10MB limit
        allowedMimeTypes: [
          'application/pdf',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
      }
    );

    if (createError) {
      console.error('❌ Error creating bucket:', createError.message);
      process.exit(1);
    }

    console.log('✅ Successfully created customer-documents bucket');
    console.log(`   - Name: ${newBucket.name}`);
    console.log(`   - Privacy: PRIVATE`);
    console.log(`   - File size limit: 10MB`);
    console.log(`   - Allowed types: PDF, JPG, PNG, WEBP, DOC, DOCX`);
    console.log('\n✨ Setup complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the verification
verifyAndCreateBucket();
