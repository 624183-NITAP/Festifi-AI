import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  const hasLiveKey = Boolean(apiKey && apiKey.trim().length > 10 && !apiKey.includes('your_gemini_api_key'));

  return NextResponse.json({
    status: 'ok',
    app: 'FestiFi AI — Celebration & Event Planner',
    version: '1.0.0',
    aiMode: hasLiveKey ? 'Google Gemini Live' : 'Deterministic Offline Engine',
    timestamp: new Date().toISOString(),
  });
}
