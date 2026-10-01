"use client";

import { QRCodeCanvas } from "qrcode.react";

export default function PortalQRCode({ value }: { value: string | null }) {
    return (
        <div className="flex min-h-64 max-w-2xl flex-col items-center justify-center rounded-2xl border border-primary/20 bg-[#141123] p-8 text-center sm:p-12">
            <h2 className="text-xl font-semibold text-primary">Your QR Code</h2>
            {value ? (
                <div className="mt-6 rounded-xl bg-white p-4">
                    <QRCodeCanvas value={value} size={220} level="H" includeMargin />
                </div>
            ) : null}
        </div>
    );
}