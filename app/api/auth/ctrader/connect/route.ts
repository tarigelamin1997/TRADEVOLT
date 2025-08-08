import { NextRequest, NextResponse } from 'next/server';
import { CTraderService } from '@/lib/services/ctrader-service';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const { userId: clerkUserId } = auth();
    const userId = clerkUserId || 'demo-user';

    // Create cTrader service instance
    const ctraderService = new CTraderService({
      apiKey: process.env.CTRADER_CLIENT_ID,
      apiSecret: process.env.CTRADER_CLIENT_SECRET,
    });

    // Generate state parameter for security
    const state = Buffer.from(JSON.stringify({
      userId,
      timestamp: Date.now(),
    })).toString('base64');

    // Get authorization URL
    const authUrl = ctraderService.getAuthorizationUrl(state);

    // Redirect to cTrader OAuth page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('cTrader connect error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to initiate cTrader connection';
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=broker&error=${encodeURIComponent(errorMessage)}`
    );
  }
}