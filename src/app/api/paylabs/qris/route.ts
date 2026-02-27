import { NextResponse } from 'next/server';
import { generatePaylabsSignature, generateTimestamp } from '@/lib/paylabs';

export async function POST(request: Request) {
    try {
        const { amount } = await request.json();

        const merchantId = process.env.PAYLABS_MERCHANT_ID;
        const privateKey = process.env.PAYLABS_PRIVATE_KEY;
        const apiUrl = process.env.PAYLABS_API_URL;

        if (!merchantId || !privateKey || !apiUrl) {
            console.error("Missing PayLabs env config");
            return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
        }

        const timestamp = generateTimestamp();
        const requestId = `REQ-QRIS-${Date.now()}`;
        const merchantTradeNo = `TRD-QRIS-${Date.now()}`;

        // QRIS Payload exactly matching the docs
        const body = {
            merchantId: merchantId,
            merchantTradeNo: merchantTradeNo,
            requestId: requestId,
            paymentType: "QRIS",
            amount: Number(amount).toFixed(2),
            productName: "Qunci Merchant Payment"
        };

        const endpoint = '/payment/v2.3/qris/create';
        const signature = generatePaylabsSignature('POST', endpoint, body, timestamp, privateKey);

        console.log("============================");
        console.log("PAYLABS QRIS REQUEST");
        console.log("Timestamp:", timestamp);
        console.log("Signature:", signature);
        console.log("============================");

        const response = await fetch(`${apiUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-TIMESTAMP': timestamp,
                'X-SIGNATURE': signature,
                'X-PARTNER-ID': merchantId,
                'X-REQUEST-ID': requestId,
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        console.log("PayLabs SIT QRIS Response:", data);

        if (response.ok && data.errCode === "0") {
            return NextResponse.json({
                success: true,
                qrisUrl: data.qrisUrl,
                qrCode: data.qrCode,
                requestId: requestId
            }, { status: 200 });
        } else {
            return NextResponse.json({
                error: 'Failed to generate QRIS',
                details: data
            }, { status: 400 });
        }


    } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : 'Unknown error';
        console.error("QRIS Route Error:", errorMsg);
        return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
}
