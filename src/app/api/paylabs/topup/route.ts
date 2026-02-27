import { NextResponse } from 'next/server';
import { generatePaylabsSignature, generateTimestamp } from '@/lib/paylabs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { amount } = body;

        if (!amount || typeof amount !== 'number') {
            return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
        }

        const merchantId = process.env.PAYLABS_MERCHANT_ID;
        const privateKey = process.env.PAYLABS_PRIVATE_KEY;
        const apiUrl = process.env.PAYLABS_API_URL;

        if (!merchantId || !privateKey || !apiUrl) {
            console.error("Missing PayLabs environment variables.");
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Must exactly match SIT endpoint from documentation
        const endpoint = '/payment/v2.3/h5/createLink';

        // Generate a 14+ digit request ID & merchant trade number as expected by PayLabs
        const uniqueId = Math.floor(Math.random() * 1000000000000000).toString();

        const payload = {
            merchantId,
            merchantTradeNo: `TOPUP-${uniqueId}`,
            requestId: uniqueId,
            amount: amount.toFixed(2).toString(), // Format as double-precision string "50000.00"
            productName: "QunciPay Top Up",
            phoneNumber: "081234567890", // PayLabs requires this for HTML5 Cashier
            redirectUrl: "http://localhost:3000/topup/success",
            lang: "en",
        };

        const timestamp = generateTimestamp();
        const signature = generatePaylabsSignature('POST', endpoint, payload, timestamp, privateKey);

        const response = await fetch(`${apiUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8',
                'X-TIMESTAMP': timestamp,
                'X-SIGNATURE': signature,
                'X-PARTNER-ID': merchantId,
                'X-REQUEST-ID': uniqueId,
            },
            body: JSON.stringify(payload),
        });

        const paylabsText = await response.text();

        try {
            const paylabsData = JSON.parse(paylabsText);

            if (paylabsData.errCode === '0' && paylabsData.url) {
                return NextResponse.json({ url: paylabsData.url }, { status: 200 });
            } else {
                console.error("PAYLABS HTML5 REJECTED PAYLOAD:", payload);
                console.error("PAYLABS HTML5 RAW RESPONSE:", paylabsData);
                return NextResponse.json({ error: 'PayLabs generic error', data: paylabsData }, { status: 400 });
            }

        } catch {
            console.error("Paylabs Top-Up Route Error: Non-JSON response:", paylabsText);
            return NextResponse.json({ error: 'Invalid PayLabs gateway response' }, { status: 500 });
        }

    } catch (error) {
        console.error("Top-Up Request Error:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
