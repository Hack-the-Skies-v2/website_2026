"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { checkInByQrCode, lookupQrCode } from "@/actions/organizerCheckIn";
import type { ScheduleEvent } from "@/components/ScheduleManager";

export default function OrganizerQrScanner({
    events,
    onCheckedIn,
}: {
    events: ScheduleEvent[];
    onCheckedIn?: () => void;
}) {
    const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
    const [scannedCode, setScannedCode] = useState("");
    const [eventId, setEventId] = useState(events[0]?.id ?? "");
    const [person, setPerson] = useState<Extract<Awaited<ReturnType<typeof lookupQrCode>>, { success: true }>["data"] | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        return () => {
            if (scannerRef.current) void scannerRef.current.stop();
        };
    }, []);

    async function stopScanner() {
        if (!scannerRef.current) return;
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
    }

    async function startScanner() {
        setError(null);
        setNotice(null);
        try {
            const { Html5Qrcode } = await import("html5-qrcode");
            const scanner = new Html5Qrcode("organizer-qr-reader");
            scannerRef.current = scanner;
            await scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                async (decodedText) => {
                    await stopScanner();
                    try {
                        const scannedPerson = await lookupQrCode({ qrCode: decodedText });
                        if (!scannedPerson.success) {
                            setError(scannedPerson.error);
                            return;
                        }
                        setScannedCode(decodedText);
                        setPerson(scannedPerson.data);
                        setNotice("QR code scanned. Choose an event and check them in.");
                    } catch (caught) {
                        setError(caught instanceof Error ? caught.message : "Could not read this QR code.");
                    }
                },
                () => undefined,
            );
            setIsScanning(true);
        } catch (caught) {
            setError(caught instanceof Error ? caught.message : "Could not start the camera.");
            scannerRef.current = null;
            setIsScanning(false);
        }
    }

    function checkIn() {
        setError(null);
        setNotice(null);
        startTransition(async () => {
            try {
                const result = await checkInByQrCode({ qrCode: scannedCode, eventId });
                if (!result.success) {
                    setError(result.error);
                    return;
                }
                setNotice(`Checked in for ${result.data.eventTitle}.`);
                setScannedCode("");
                setPerson(null);
                onCheckedIn?.();
            } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Could not check in this user.");
            }
        });
    }

    return (
        <div className="space-y-4 rounded-lg border border-neutral-200 p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="font-semibold text-neutral-900">Scan a QR code</h2>
                </div>
                {isScanning ? (
                    <button type="button" onClick={() => void stopScanner()} className="rounded-md border border-neutral-300 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">Stop camera</button>
                ) : (
                    <button type="button" onClick={() => void startScanner()} className="rounded-md bg-neutral-900 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-neutral-800">Start camera</button>
                )}
            </div>
            <div id="organizer-qr-reader" className="max-w-md overflow-hidden rounded-md border border-neutral-200" />
            {scannedCode ? (
                <div className="max-w-md space-y-3">
                    {person ? (
                        <div className="space-y-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                            <div>
                                <p className="font-semibold text-neutral-900">{person.name}</p>
                                <p className="capitalize text-neutral-500">{person.role}</p>
                            </div>
                            {person.pronouns.length > 0 || person.pronounsOther ? <p><span className="font-medium text-neutral-900">Pronouns:</span> {[...person.pronouns, person.pronounsOther].filter(Boolean).join(", ")}</p> : null}
                            {person.dietaryRestrictions.length > 0 || person.dietaryOther ? <p><span className="font-medium text-neutral-900">Dietary:</span> {[...person.dietaryRestrictions, person.dietaryOther].filter(Boolean).join(", ")}</p> : null}
                            {person.accessibilityAccommodations.length > 0 || person.accessibilityOther ? <p><span className="font-medium text-neutral-900">Accessibility:</span> {[...person.accessibilityAccommodations, person.accessibilityOther].filter(Boolean).join(", ")}</p> : null}
                        </div>
                    ) : null}
                    <label className="block text-sm font-medium text-neutral-700">Check in for<select value={eventId} onChange={(event) => setEventId(event.target.value)} className="mt-1 block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-normal text-neutral-900 outline-none focus:border-neutral-500">{events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label>
                    <button type="button" disabled={isPending || !eventId} onClick={checkIn} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50">{isPending ? "Checking in..." : "Check in"}</button>
                </div>
            ) : null}
            {events.length === 0 ? <p className="text-sm text-neutral-500">Create a schedule event before checking anyone in.</p> : null}
            {notice ? <p role="status" className="text-sm text-neutral-700">{notice}</p> : null}
            {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
        </div>
    );
}