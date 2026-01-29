#!/usr/bin/env node
/**
 * PHASE 1: Create blog_articles table in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const createTableSQL = `
-- Drop existing table if needed (comment out if you want to preserve data)
-- DROP TABLE IF EXISTS blog_articles;

-- Create blog_articles table
CREATE TABLE IF NOT EXISTS blog_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  native_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,

  -- Frontmatter fields
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  difficulty TEXT,
  read_time INTEGER,
  image TEXT,
  tags TEXT[],

  -- Content
  content TEXT NOT NULL,
  content_html TEXT, -- Pre-rendered HTML for fast serving

  -- Metadata
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published BOOLEAN DEFAULT true,

  UNIQUE(native_lang, target_lang, slug)
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_blog_native_lang ON blog_articles(native_lang);
CREATE INDEX IF NOT EXISTS idx_blog_target_lang ON blog_articles(target_lang);
CREATE INDEX IF NOT EXISTS idx_blog_category ON blog_articles(category);
CREATE INDEX IF NOT EXISTS idx_blog_lang_pair ON blog_articles(native_lang, target_lang);
CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_articles(slug);
CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_articles(published);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_blog_articles_updated_at ON blog_articles;
CREATE TRIGGER update_blog_articles_updated_at
    BEFORE UPDATE ON blog_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;

async function createSchema() {
  console.log('🚀 PHASE 1: Creating blog_articles schema...\n');

  try {
    // Execute SQL via Supabase's rpc or direct query
    // Note: Supabase JS client doesn't support raw SQL directly,
    // so we'll use the REST API

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ sql: createTableSQL })
    });

    if (!response.ok) {
      // If rpc doesn't exist, we'll need to create it or use another method
      console.log('Note: exec_sql RPC not available. Creating schema via individual statements...');

      // Try creating table via Supabase's SQL Editor API (Management API)
      // This requires using the dashboard or supabase CLI

      // Let's try a workaround - check if table exists
      const { data, error } = await supabase
        .from('blog_articles')
        .select('id')
        .limit(1);

      if (error && error.code === '42P01') {
        // Table doesn't exist - need manual creation
        console.log('\n⚠️  Table does not exist. Please run this SQL in Supabase Dashboard:\n');
        console.log('Go to: https://supabase.com/dashboard/project/iiusoobuoxurysrhqptx/sql/new\n');
        console.log('='.repeat(60));
        console.log(createTableSQL);
        console.log('='.repeat(60));
        console.log('\nAfter running the SQL, re-run this script to verify.\n');

        // Write SQL to file for easy copy
        const fs = await import('fs');
        fs.writeFileSync(join(__dirname, 'create-schema.sql'), createTableSQL);
        console.log('📄 SQL also saved to: blog/scripts/create-schema.sql\n');

        return false;
      } else if (error) {
        console.error('Error checking table:', error);
        return false;
      } else {
        console.log('✅ Table blog_articles already exists!\n');
        return true;
      }
    }

    console.log('✅ Schema created successfully!\n');
    return true;

  } catch (err) {
    console.error('Error:', err.message);
    return false;
  }
}

// Run
createSchema().then(success => {
  if (success) {
    console.log('✅ PHASE 1 COMPLETE: Schema ready\n');
  } else {
    console.log('⏳ PHASE 1 PENDING: Manual SQL execution required\n');
  }
  process.exit(success ? 0 : 1);
});
