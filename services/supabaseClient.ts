import { createClient } from '@supabase/supabase-js';

// Configuration from the user's prompt
const SUPABASE_URL = 'https://ouectsnogojxlsnywiyh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91ZWN0c25vZ29qeGxzbnl3aXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTAwOTIsImV4cCI6MjA3OTk4NjA5Mn0.9lVuMz2-t2WyLeYzK9vK19Mpipnu0BIPeOXvNMi-HUc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Error logging out:', error.message);
  return { error };
};
