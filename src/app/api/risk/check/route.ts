import { NextResponse } from 'next/server';
import { analyzeTransactionRisk } from '@/lib/riskEngine';

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // The existing QunciContext sends:
        // {
        //   userId, amount, merchant, timestamp, location, userHistory: { avgTransaction, lastLogin, typicalLocation }
        // }

        // Call the AI Risk Engine
        const riskResult = await analyzeTransactionRisk(body);

        return NextResponse.json(riskResult);
    } catch (error) {
        console.error('Risk API Error:', error);
        return NextResponse.json(
            { error: 'Failed to assess transaction risk' },
            { status: 500 }
        );
    }
}
