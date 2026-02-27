import { NextResponse } from 'next/server';
import { generatePaylabsSignature, generateTimestamp } from '@/lib/paylabs';

export async function POST(request: Request) {
    try {
        const { amount, bankCode, accountNo, accountName } = await request.json();

        const merchantId = process.env.PAYLABS_MERCHANT_ID;
        const privateKey = process.env.PAYLABS_PRIVATE_KEY;
        const apiUrl = process.env.PAYLABS_API_URL;

        if (!merchantId || !privateKey || !apiUrl) {
            return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
        }

        const timestamp = generateTimestamp();

        // Standard payload format for generating the RSA signature 
        const body = {
            merchantId: merchantId,
            requestNo: `REMIT-${Date.now()}`,
            amount: amount.toString(),
            receiverBankCode: bankCode,
            receiverAccountNo: accountNo,
            receiverAccountName: accountName,
            purpose: "Merchant Settlement"
        };

        const endpoint = '/payment/v2.3/remit/create';
        const signature = generatePaylabsSignature('POST', endpoint, body, timestamp, privateKey);

        console.log("============================");
        console.log("PAYLABS DISBURSEMENT REQUEST");
        console.log("Endpoint:", endpoint);
        console.log("Signature:", signature);
        console.log("Body:", body);
        console.log("============================");

        try {
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

            const dataText = await response.text();
            let parsedData;
            try {
                parsedData = JSON.parse(dataText);
            } catch (e) {
                console.error("Paylabs non-JSON response:", dataText);
                return NextResponse.json({ error: 'PayLabs returned invalid data', raw: dataText }, { status: 500 });
            }

            console.log("PayLabs Cashout Response:", parsedData);

            if (parsedData.errCode === '0' || parsedData.errCode === '0000') {
                return NextResponse.json({
                    success: true,
                    data: parsedData
                }, { status: 200 });
            } else {
                return NextResponse.json({
                    success: false,
                    error: parsedData.errCodeDes || 'Disbursement Failed',
                    data: parsedData
                }, { status: 400 });
            }

        } catch (fetchError) {
            console.error("Could not reach SIT server, network error.", fetchError);
            return NextResponse.json({ error: 'Network Error reaching PayLabs API' }, { status: 500 });
        }

    } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : 'Unknown error';
        console.error("API Route Error:", errorMsg);
        return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
}
