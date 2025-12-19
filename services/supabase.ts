
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dmuasgyxexvmcncauxfk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtdWFzZ3l4ZXh2bWNuY2F1eGZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNTEzNzQsImV4cCI6MjA4MTcyNzM3NH0.mrH_4SpFJZt-jJaAOONARlraNRLtYftx8_SWrNQiH1Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
