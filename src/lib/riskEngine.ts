// lib/riskEngine.ts
import { z } from 'zod';

const RiskSchema = z.object({
    riskScore: z.number(),
    decision: z.enum(['APPROVE', 'HOLD', 'REJECT']),
    reason: z.string(),
    flags: z.array(z.string())
});

export type TransactionRisk = z.infer<typeof RiskSchema> & { transactionId?: string };

interface TransactionData {
    userId: string;
    amount: number;
    merchant: string;
    timestamp: string;
    location: string;
    userHistory: {
        avgTransaction: number;
        lastLogin: string;
        typicalLocation: string;
    };
}

import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.QWEN_API_KEY,
    baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1", // Using compatible-mode as per DashScope docs for OpenAI SDKs
});

export async function analyzeTransactionRisk(transactionData: TransactionData): Promise<TransactionRisk> {
    // ===== QWEN AI: Real fraud detection =====
    const systemPrompt = `You are an AI fraud detection engine for QunciPay Indonesia. Analyze financial transactions and return ONLY valid JSON.
  
Schema: { "riskScore": number (0-100), "decision": "APPROVE"|"HOLD"|"REJECT", "reason": "Detailed explanation of the assessment", "flags": ["array", "of", "risk", "factors"] }

For risk assessment, consider:
- Transaction amount vs user history average
- Time of transaction (unusual hours)
- Location consistency
- Merchant category
- Frequency patterns
- Behavioral anomalies

Provide clear, specific reasons in the "reason" field.`;

    const userPrompt = `Analyze this transaction for fraud risk: ${JSON.stringify(transactionData)}`;

    try {
        const completion = await openai.chat.completions.create({
            model: "qwen-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0,
        });

        let content = completion.choices[0].message.content;

        if (!content) {
            throw new Error("No content returned from AI");
        }

        content = content.replace(/```json/g, '').replace(/```/g, '').trim();

        const parsed = JSON.parse(content);
        return {
            transactionId: crypto.randomUUID(),
            ...RiskSchema.parse(parsed)
        };

    } catch (error: unknown) {
        console.error("Risk Engine Failure", error);
        const errorMessage = error instanceof Error ? error.message : 'Risk Engine Unavailable';
        return {
            transactionId: crypto.randomUUID(),
            riskScore: 100,
            decision: 'HOLD',
            reason: `System Error: ${errorMessage}`,
            flags: ['SYSTEM_ERROR']
        };
    }

}
