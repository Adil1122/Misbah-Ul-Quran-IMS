import { createClient } from '@supabase/supabase-js';

const url = 'https://njskmffxcmnvifikgffs.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qc2ttZmZ4Y21udmlmaWtnZmZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwMjU1OTAsImV4cCI6MjEwNzYwMTU5MH0.UtNOkQ73Tk3sOMg_dWvQ5R8SUF3RyK6LK2Yxf_g9CBc';

const sb = createClient(url, key, { auth: { persistSession: false } });

async function test() {
  const tables = [
    'campuses',
    'users',
    'students',
    'classes',
    'teacher_profiles',
    'teacher_attendances',
    'student_attendances',
    'incident_logs',
    'document_uplouds',
    'audit_logs',
    'payment_invoices'
  ];

  for (const t of tables) {
    try {
      const { data, error } = await sb.from(t).select('*').limit(2);
      if (error) {
        console.log(`[TABLE ${t}] ERROR: ${error.message} (${error.code})`);
      } else {
        console.log(`[TABLE ${t}] OK - found ${data?.length} row(s)`);
      }
    } catch (e: any) {
      console.log(`[TABLE ${t}] EXCEPTION: ${e.message}`);
    }
  }

  // Check columns of incident_logs
  try {
    const { data, error } = await sb.from('incident_logs').select('*').limit(1);
    console.log('incident_logs test select:', data, error?.message);
  } catch (e: any) {
    console.log('incident_logs error:', e.message);
  }

  // Check if medical_records or similar table exists
  for (const medTable of ['medical_records', 'student_medical_records', 'medicals']) {
    const { data, error } = await sb.from(medTable).select('*').limit(1);
    console.log(`Table ${medTable}:`, error ? error.message : `OK, count ${data?.length}`);
  }

  // Test storage bucket creation / check
  try {
    const { data: bData, error: bErr } = await sb.storage.createBucket('misbah-documents', {
      public: false,
      fileSizeLimit: 26214400, // 25MB
    });
    console.log('Create misbah-documents bucket result:', bData, bErr?.message);
  } catch (e: any) {
    console.log('createBucket exception:', e.message);
  }

  // Test uploading a test file to misbah-documents bucket
  try {
    const testFile = Buffer.from('Test document content for Misbah-ul-Quran IMS');
    const { data: upData, error: upErr } = await sb.storage
      .from('misbah-documents')
      .upload(`test/test_${Date.now()}.txt`, testFile, {
        contentType: 'text/plain',
        upsert: true,
      });
    console.log('Upload test result:', upData, upErr?.message);
  } catch (e: any) {
    console.log('upload exception:', e.message);
  }

  process.exit(0);
}

test();
