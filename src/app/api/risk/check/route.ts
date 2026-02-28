// app/api/risk/check/route.ts
import { NextResponse } from 'next/server';
import { analyzeTransactionRisk } from '@/lib/riskEngine';
import { z } from 'zod';

const transactionSchema = z.object({
    userId: z.string(),
    amount: z.number(),
    merchant: z.string(),
    timestamp: z.string(),
    location: z.string(),
    userHistory: z.object({
        avgTransaction: z.number(),
        lastLogin: z.string(),
        typicalLocation: z.string(),
    }),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validatedData = transactionSchema.parse(body);

        // Call the Risk Engine
        const riskResult = await analyzeTransactionRisk(validatedData);

        // 3. SAVE result to DB (Transaction table updated with status: 'HOLD' | 'APPROVE')
        // In a real production setting:
        // await db.transaction.update({ where: { id: riskResult.transactionId }, data: { status: riskResult.decision } });

        // Audit Log
        console.log(`[QunciGuard] Tx ${riskResult.transactionId}: ${riskResult.decision} (Score: ${riskResult.riskScore})`);

        // 4. Return to frontend
        return NextResponse.json(riskResult);

    } catch (error) {
        console.error("API error", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid transaction data', details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Risk assessment failed' }, { status: 500 });
    }
}
