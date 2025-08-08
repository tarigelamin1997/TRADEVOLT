import { NextRequest, NextResponse } from 'next/server';
import { CTraderService } from '@/lib/services/ctrader-service';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { encrypt } from '@/lib/utils/crypto';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization code from query params
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle errors from cTrader
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=broker&error=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=broker&error=No authorization code received`
      );
    }

    // Get current user
    const { userId: clerkUserId } = auth();
    const userId = clerkUserId || 'demo-user';

    // Create cTrader service instance
    const ctraderService = new CTraderService({});

    // Exchange code for tokens
    const tokenResponse = await ctraderService.exchangeCodeForToken(code);

    // Get accounts to verify connection
    const accounts = await ctraderService.getAccounts();
    
    if (accounts.length === 0) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=broker&error=No trading accounts found`
      );
    }

    // Use the first account
    const account = accounts[0];

    // Encrypt sensitive data
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    const encryptedAccessToken = encrypt(tokenResponse.access_token, encryptionKey);
    const encryptedRefreshToken = encrypt(tokenResponse.refresh_token, encryptionKey);

    // Save the connection to database
    await prisma.brokerConnection.create({
      data: {
        userId,
        platform: 'cTrader',
        accountName: `${account.brokerName} - ${account.isLive ? 'Live' : 'Demo'}`,
        accountId: `ctrader-${account.ctidTraderAccountId}`,
        externalAccountId: account.ctidTraderAccountId.toString(),
        brokerName: account.brokerName,
        accountType: account.isLive ? 'live' : 'demo',
        accountCurrency: account.currency,
        connectionStatus: 'connected',
        connectionMethod: 'oauth2',
        encryptedAccessToken,
        encryptedRefreshToken,
        supportsRealtime: true,
        supportsHistorical: true,
        supportsPositions: true,
        supportsOrders: false,
        autoSync: false,
        lastSync: new Date(),
      },
    });

    // Redirect back to settings with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=broker&success=cTrader account connected successfully`
    );
  } catch (error) {
    console.error('cTrader OAuth callback error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to connect cTrader account';
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=broker&error=${encodeURIComponent(errorMessage)}`
    );
  }
}