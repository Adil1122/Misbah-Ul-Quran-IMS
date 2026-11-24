import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStudentAttendance() {
  console.log('Testing student_attendances table...');
  const testRecord = {
    campus_id: 'cmp-uk-01',
    class_id: 'cls-uk-01',
    student_id: 'std-test-01',
    date: '2026-10-29',
    status: 'PRESENT',
    arrival_time: '16:30',
    remarks: 'Test attendance insert',
    recorded_by: 'Test Admin',
  };

  const { data, error } = await supabase
    .from('student_attendances')
    .upsert([testRecord])
    .select();

  console.log('Upsert result:', { data, error });

  const { data: rows, error: selectErr } = await supabase
    .from('student_attendances')
    .select('*')
    .limit(5);

  console.log('Select rows:', { rows, selectErr });

  // Clean up test record if succeeded
  if (data && data.length > 0) {
    await supabase.from('student_attendances').delete().eq('student_id', 'std-test-01');
    console.log('Cleaned up test record.');
  }
}

testStudentAttendance();
