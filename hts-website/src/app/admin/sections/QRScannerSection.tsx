import React, { useEffect, useRef, useState, type SubmitEvent } from "react";
import { Attendance, Team, User } from "../types";
import { Header, Stat } from "../components/Common";

type Props = {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    meals: Attendance[];
    setMeals: React.Dispatch<React.SetStateAction<Attendance[]>>;
    workshops: Attendance[];
    setWorkshops: React.Dispatch<React.SetStateAction<Attendance[]>>;
    teams: Team[];
    notify: (msg: string) => void;
};

type ScanMode = "checkin" | "meal" | "workshop";

type ScanLogItem = {
    id: string;
    timestamp: string;
    userName: string;
    userRole: string;
    modeLabel: string;
    targetName: string;
    success: boolean;
    message: string;
};

export default function QRScannerSection({
    users,
    setUsers,
    meals,
    setMeals,
    workshops,
    setWorkshops,
    teams,
    notify,
}: Props) {
    const [mode, setMode] = useState<ScanMode>("checkin");
    const [selectedMealId, setSelectedMealId] = useState<string>(meals[0]?.id ?? "");
    const [selectedWorkshopId, setSelectedWorkshopId] = useState<string>(
        workshops[0]?.id ?? "",
    );
    const [inputCode, setInputCode] = useState("");
    const [lastScannedUser, setLastScannedUser] = useState<User | null>(null);
    const [lastScanStatus, setLastScanStatus] = useState<{
        success: boolean;
        text: string;
    } | null>(null);
    const [scanHistory, setScanHistory] = useState<ScanLogItem[]>([]);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, [mode, selectedMealId, selectedWorkshopId]);

    const team = (id: string | null) => teams.find((item) => item.id === id);

    const currentTargetName =
        mode === "checkin"
            ? "General Event Check-in"
            : mode === "meal"
                ? meals.find((m) => m.id === selectedMealId)?.name || "Selected Meal"
                : workshops.find((w) => w.id === selectedWorkshopId)?.name ||
                "Selected Workshop";

    const currentAttendeeCount =
        mode === "checkin"
            ? users.filter((u) => u.checkedIn).length
            : mode === "meal"
                ? meals.find((m) => m.id === selectedMealId)?.attendeeIds.length || 0
                : workshops.find((w) => w.id === selectedWorkshopId)?.attendeeIds.length ||
                0;

    const processCode = (rawCode: string) => {
        const code = rawCode.trim();
        if (!code) return;

        const matchedUser = users.find(
            (u) =>
                u.qr.toLowerCase() === code.toLowerCase() ||
                u.email.toLowerCase() === code.toLowerCase() ||
                u.id.toLowerCase() === code.toLowerCase(),
        );

        const now = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });

        if (!matchedUser) {
            setLastScannedUser(null);
            setLastScanStatus({
                success: false,
                text: `No participant found matching code "${code}".`,
            });
            notify("QR code not recognized");
            setScanHistory((prev) => [
                {
                    id: `log-${Date.now()}`,
                    timestamp: now,
                    userName: "Unknown",
                    userRole: "-",
                    modeLabel: mode.toUpperCase(),
                    targetName: currentTargetName,
                    success: false,
                    message: `Unrecognized code: ${code}`,
                },
                ...prev.slice(0, 19),
            ]);
            setInputCode("");
            inputRef.current?.focus();
            return;
        }

        setLastScannedUser(matchedUser);

        if (mode === "checkin") {
            if (matchedUser.checkedIn) {
                setLastScanStatus({
                    success: true,
                    text: `${matchedUser.name} is already checked in for the event.`,
                });
                notify(`${matchedUser.name} already checked in`);
            } else {
                setUsers((prev) =>
                    prev.map((u) =>
                        u.id === matchedUser.id ? { ...u, checkedIn: true } : u,
                    ),
                );
                setLastScanStatus({
                    success: true,
                    text: `Successfully checked in ${matchedUser.name} for the event!`,
                });
                notify(`Checked in ${matchedUser.name}`);
            }
        } else if (mode === "meal") {
            const activeMeal = meals.find((m) => m.id === selectedMealId) || meals[0];
            if (activeMeal) {
                const alreadyAttended = activeMeal.attendeeIds.includes(matchedUser.id);
                if (alreadyAttended) {
                    setLastScanStatus({
                        success: true,
                        text: `${matchedUser.name} has already received ${activeMeal.name}.`,
                    });
                    notify(`Already recorded for ${activeMeal.name}`);
                } else {
                    setMeals((prev) =>
                        prev.map((m) =>
                            m.id === activeMeal.id
                                ? { ...m, attendeeIds: [...m.attendeeIds, matchedUser.id] }
                                : m,
                        ),
                    );
                    setLastScanStatus({
                        success: true,
                        text: `Recorded ${matchedUser.name} for ${activeMeal.name}!`,
                    });
                    notify(`Meal recorded for ${matchedUser.name}`);
                }
            }
        } else if (mode === "workshop") {
            const activeWorkshop =
                workshops.find((w) => w.id === selectedWorkshopId) || workshops[0];
            if (activeWorkshop) {
                const alreadyAttended = activeWorkshop.attendeeIds.includes(
                    matchedUser.id,
                );
                if (alreadyAttended) {
                    setLastScanStatus({
                        success: true,
                        text: `${matchedUser.name} is already marked present for ${activeWorkshop.name}.`,
                    });
                    notify(`Already marked for ${activeWorkshop.name}`);
                } else {
                    setWorkshops((prev) =>
                        prev.map((w) =>
                            w.id === activeWorkshop.id
                                ? { ...w, attendeeIds: [...w.attendeeIds, matchedUser.id] }
                                : w,
                        ),
                    );
                    setLastScanStatus({
                        success: true,
                        text: `Marked attendance for ${matchedUser.name} in ${activeWorkshop.name}!`,
                    });
                    notify(`Workshop attendance recorded`);
                }
            }
        }

        setScanHistory((prev) => [
            {
                id: `log-${Date.now()}`,
                timestamp: now,
                userName: matchedUser.name,
                userRole: matchedUser.role,
                modeLabel:
                    mode === "checkin"
                        ? "CHECK-IN"
                        : mode === "meal"
                            ? "MEAL"
                            : "WORKSHOP",
                targetName: currentTargetName,
                success: true,
                message: "Scan processed successfully",
            },
            ...prev.slice(0, 19),
        ]);

        setInputCode("");
        inputRef.current?.focus();
    };

    const handleFormSubmit = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        processCode(inputCode);
    };

    return (
        <>
            <Header
                label="Station Scanner"
                title="QR Scanner"
                description="Check in attendees for general entrance, catered meals, or technical workshops."
            />

            <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h3>Select scanning destination</h3>
                    <span>Target: {currentTargetName}</span>
                </div>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                    <button
                        className={`rounded-lg px-3 py-2 text-sm ${mode === "checkin" ? "bg-amber-300 text-slate-950" : "border border-slate-700 text-slate-300"}`}
                        onClick={() => setMode("checkin")}
                    >
                        General Check-in
                    </button>
                    <button
                        className={`rounded-lg px-3 py-2 text-sm ${mode === "meal" ? "bg-amber-300 text-slate-950" : "border border-slate-700 text-slate-300"}`}
                        onClick={() => setMode("meal")}
                    >
                        Meals
                    </button>
                    <button
                        className={`rounded-lg px-3 py-2 text-sm ${mode === "workshop" ? "bg-amber-300 text-slate-950" : "border border-slate-700 text-slate-300"}`}
                        onClick={() => setMode("workshop")}
                    >
                        Workshops
                    </button>
                </div>

                {mode === "meal" && (
                    <div style={{ marginTop: "0.5rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
                            Select Meal:
                        </label>
                        <select
                            value={selectedMealId}
                            onChange={(e) => setSelectedMealId(e.target.value)}
                            style={{ width: "100%", maxWidth: "400px" }}
                        >
                            {meals.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.name} ({m.start} - {m.end}) · {m.attendeeIds.length} served
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {mode === "workshop" && (
                    <div style={{ marginTop: "0.5rem" }}>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
                            Select Workshop:
                        </label>
                        <select
                            value={selectedWorkshopId}
                            onChange={(e) => setSelectedWorkshopId(e.target.value)}
                            style={{ width: "100%", maxWidth: "400px" }}
                        >
                            {workshops.map((w) => (
                                <option key={w.id} value={w.id}>
                                    {w.name} ({w.room || "Room TBD"} · {w.start} - {w.end}) ·{" "}
                                    {w.attendeeIds.length} attended
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <Stat label="Current target" value={currentTargetName} />
                <Stat
                    label="Attendance for this target"
                    value={`${currentAttendeeCount} / ${users.length}`}
                />
                <Stat label="Scans this session" value={scanHistory.length} />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                    <h3>Scan participant QR badge</h3>
                    <p className="text-sm text-slate-400">
                        Point your handheld scanner at the participant QR code or type their code/email below.
                    </p>
                    <form onSubmit={handleFormSubmit}>
                        <input
                            ref={inputRef}
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value)}
                            placeholder="Scan QR or enter code (e.g. HTS-AVA-001)"
                            autoFocus
                        />
                        <button className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950">Submit scan</button>
                    </form>

                    <div style={{ marginTop: "1.5rem" }}>
                        <small className="mb-2 block text-xs text-slate-400">
                            Quick test sample QR codes:
                        </small>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            {users.slice(0, 5).map((u) => (
                                <button
                                    key={u.id}
                                    className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300"
                                    style={{ fontSize: "0.85rem", padding: "0.35rem 0.65rem" }}
                                    onClick={() => processCode(u.qr)}
                                >
                                    {u.name} ({u.qr})
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h3>Participant scan result</h3>
                    </div>
                    {lastScanStatus && (
                        <div
                            style={{
                                padding: "0.75rem 1rem",
                                borderRadius: "4px",
                                marginBottom: "1rem",
                                background: lastScanStatus.success
                                    ? "rgba(34, 197, 94, 0.15)"
                                    : "rgba(239, 68, 68, 0.15)",
                                color: lastScanStatus.success ? "#4ade80" : "#f87171",
                            }}
                        >
                            <strong>{lastScanStatus.text}</strong>
                        </div>
                    )}

                    {lastScannedUser ? (
                        <div>
                            <dl className="border-b border-slate-800 py-3">
                                <dt>Name</dt>
                                <dd>
                                    <strong>{lastScannedUser.name}</strong>
                                </dd>
                            </dl>
                            <dl className="border-b border-slate-800 py-3">
                                <dt>Email</dt>
                                <dd>{lastScannedUser.email}</dd>
                            </dl>
                            <dl className="border-b border-slate-800 py-3">
                                <dt>Role</dt>
                                <dd>
                                    {lastScannedUser.role}
                                    {lastScannedUser.admin && " (Admin)"}
                                </dd>
                            </dl>
                            <dl className="border-b border-slate-800 py-3">
                                <dt>Team</dt>
                                <dd>{team(lastScannedUser.teamId)?.name || "No team assigned"}</dd>
                            </dl>
                            <dl className="border-b border-slate-800 py-3">
                                <dt>Event Check-in</dt>
                                <dd>{lastScannedUser.checkedIn ? "Checked in" : "Not checked in"}</dd>
                            </dl>
                            <dl className="border-b border-slate-800 py-3">
                                <dt>Points Balance</dt>
                                <dd>{lastScannedUser.points} pts</dd>
                            </dl>
                            <dl className="border-b border-slate-800 py-3">
                                <dt>Badge QR</dt>
                                <dd>{lastScannedUser.qr}</dd>
                            </dl>
                        </div>
                    ) : (
                        <div className="py-12 text-center text-sm text-slate-400">
                            No recent participant scanned. Awaiting barcode scan...
                        </div>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
                <div className="mb-4 flex items-center justify-between gap-3 p-5 pb-0">
                    <h3>Recent scans at this station</h3>
                    <span>{scanHistory.length} total entries</span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Participant</th>
                            <th>Role</th>
                            <th>Mode</th>
                            <th>Activity / Target</th>
                            <th>Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scanHistory.map((item) => (
                            <tr key={item.id}>
                                <td>{item.timestamp}</td>
                                <td>
                                    <strong>{item.userName}</strong>
                                </td>
                                <td>{item.userRole}</td>
                                <td>{item.modeLabel}</td>
                                <td>{item.targetName}</td>
                                <td>
                                    <span
                                        style={{
                                            color: item.success ? "#4ade80" : "#f87171",
                                        }}
                                    >
                                        {item.message}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {scanHistory.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>
                                    Scan history will appear here once codes are scanned.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
