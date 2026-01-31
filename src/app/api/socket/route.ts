import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return new Response('Socket.IO server runs on custom server', { status: 200 });
}
