import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { amount, bankCode, accountNo, accountName } = await request.json();

        console.log("============================");
        console.log("PAYLABS DISBURSEMENT MOCK");
        console.log(`Sending Rp ${amount} to ${bankCode} - ${accountNo} (${accountName})`);
        console.log("============================");

        // Simulate network delay to PayLabs SIT Gateway
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Since PayLabs Remittance documentation is fully hidden behind their merchant login,
        // we simulate a perfectly successful response matching their standard JSON format 
        // to ensure the Hackathon UI presentation is flawless.
        const mockResponse = {
            errCode: "0",
            errCodeDes: "Success",
            merchantId: process.env.PAYLABS_MERCHANT_ID || "MOCK_MERCHANT",
            requestNo: `REMIT-${Date.now()}`,
            amount: Number(amount).toFixed(2),
            status: "SUCCESS",
            settlementTime: new Date().toISOString()
        };

        return NextResponse.json({
            success: true,
            data: mockResponse
        }, { status: 200 });

    } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : 'Unknown error';
        console.error("Cashout Route Error:", errorMsg);
        return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
}
