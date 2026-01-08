import { createClient } from '@supabase/supabase-js';

// CORS configuration - secure version that prevents wildcard + credentials
function setCorsHeaders(req: any, res: any): boolean {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
  const origin = req.headers.origin || '';

  // Check for explicit origin match (not wildcard)
  const isExplicitMatch = origin && allowedOrigins.includes(origin) && origin !== '*';

  if (isExplicitMatch) {
    // Explicit match - safe to allow credentials
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (allowedOrigins.includes('*')) {
    // Wildcard mode - NEVER combine with credentials (security vulnerability)
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Do NOT set credentials header with wildcard
  } else if (allowedOrigins.length > 0) {
    // No match but have allowed origins - use first one
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  return req.method === 'OPTIONS';
}

// Verify user authentication
async function verifyAuth(req: any): Promise<{ userId: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase config for auth verification');
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.error('Auth verification failed:', error?.message || 'No user');
    return null;
  }

  return { userId: user.id };
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify authentication
  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  // Parse request body
  let body = req.body;
  if (typeof body === 'string' && body.length > 0) {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON format in request body.' });
    }
  }

  const { amount } = body || {};

  // Validate amount
  if (typeof amount !== 'number' || amount < 1 || amount > 100) {
    return res.status(400).json({ error: 'Invalid amount. Must be a number between 1 and 100.' });
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get current XP
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('xp, level')
      .eq('id', auth.userId)
      .single();

    if (fetchError || !profile) {
      console.error('Error fetching profile:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch profile.' });
    }

    const currentXp = profile.xp || 0;
    const newXp = currentXp + amount;

    // Update XP in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ xp: newXp })
      .eq('id', auth.userId);

    if (updateError) {
      console.error('Error updating XP:', updateError);
      return res.status(500).json({ error: 'Failed to update XP.' });
    }

    // Return updated XP info
    return res.status(200).json({
      success: true,
      previousXp: currentXp,
      newXp: newXp,
      xpGained: amount
    });

  } catch (error: any) {
    console.error('Error in increment-xp:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
