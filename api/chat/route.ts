
// This file is deprecated to resolve a 405/500 routing conflict.
// All chat logic is now handled exclusively by /api/chat.ts
export async function GET() { return new Response(null, { status: 410 }); }
export async function POST() { return new Response(null, { status: 410 }); }
