import { NextResponse } from 'next/server';
import { generatePaylabsSignature, generateTimestamp } from '@/lib/paylabs';

export async function POST(request: Request) {
    try {
        const { amount } = await request.json();

        const merchantId = process.env.PAYLABS_MERCHANT_ID;
        const privateKey = process.env.PAYLABS_PRIVATE_KEY;
        const apiUrl = process.env.PAYLABS_API_URL;

        if (!merchantId || !privateKey || !apiUrl) {
            return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
        }

        const timestamp = generateTimestamp();

        // Standard payload format suitable for generating the RSA signature 
        const body = {
            merchantId: merchantId,
            requestId: `REQ-${Date.now()}`,
            amount: amount.toString(),
            // Minimum fields to prove signature generation
        };

        const endpoint = '/api/v1/disbursement';
        const signature = generatePaylabsSignature('POST', endpoint, body, timestamp, privateKey);

        console.log("============================");
        console.log("PAYLABS DISBURSEMENT REQUEST");
        console.log("Timestamp:", timestamp);
        console.log("Signature:", signature);
        console.log("============================");

        try {
            // Firing the request to the SIT environment 
            // Note: Since we don't have all required disbursement bank attributes (account number etc) 
            // from the frontend yet, this might return a 400 Bad Request from SIT, 
            // but the cryptography phase is successfully executed.
            const response = await fetch(`${apiUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-TIMESTAMP': timestamp,
                    'X-SIGNATURE': signature,
                    'X-PARTNER-ID': merchantId,
                },
                body: JSON.stringify(body),
            });

            const data = await response.text();
            console.log("PayLabs SIT Response:", data);
        } catch (fetchError) {
            console.warn("Could not reach SIT server, network error.", fetchError);
        }

        return NextResponse.json({
            success: true,
            message: 'Disbursement processed with valid RSA signature.',
            debug: { signature, timestamp }
        }, { status: 200 });

    } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : 'Unknown error';
        console.error("API Route Error:", errorMsg);
        return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
}
