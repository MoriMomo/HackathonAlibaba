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
    const systemPrompt = `You are a fraud detection engine. Output ONLY valid JSON.
  Do not use markdown blocks.
  Schema: { "riskScore": number, "decision": "APPROVE"|"HOLD"|"REJECT", "reason": "string", "flags": [] }`;

    const userPrompt = `Analyze this transaction: ${JSON.stringify(transactionData)}`;

    try {
        const completion = await openai.chat.completions.create({
            model: "qwen-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0,
        });

        // Extract Content
        let content = completion.choices[0].message.content;

        if (!content) {
            throw new Error("No content returned from AI");
        }

        // Clean Markdown (Common Qwen issue)
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();

        // Validate with Zod
        const parsed = JSON.parse(content);
        return {
            transactionId: crypto.randomUUID(),
            ...RiskSchema.parse(parsed)
        };

    } catch (error: unknown) {
        console.error("Risk Engine Failure", error);
        const errorMessage = error instanceof Error ? error.message : 'Risk Engine Unavailable';
        // FAIL CLOSED: If AI breaks, default to HOLD for safety
        return {
            transactionId: crypto.randomUUID(),
            riskScore: 100,
            decision: 'HOLD',
            reason: `System Error: ${errorMessage}`,
            flags: ['SYSTEM_ERROR']
        };
    }
}
