"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    createOrganizerPrize,
    deleteOrganizerPrize,
    deleteOrganizerPrizeImage,
    updateOrganizerPrize,
} from "@/actions/organizerPrizes";

export type OrganizerPrize = {
    id: string;
    name: string;
    description: string | null;
    points_required: number;
    quantity: number | null;
    max_redemptions: number | null;
    active: boolean;
    image_path: string | null;
    image_url: string | null;
};

type PrizeForm = {
    name: string;
    description: string;
    pointsRequired: string;
    quantity: string;
    maxRedemptions: string;
    active: boolean;
    removeImage: boolean;
};

function formFromPrize(prize: OrganizerPrize): PrizeForm {
    return {
        name: prize.name,
        description: prize.description ?? "",
        pointsRequired: String(prize.points_required),
        quantity: prize.quantity == null ? "" : String(prize.quantity),
        maxRedemptions: prize.max_redemptions == null ? "" : String(prize.max_redemptions),
        active: prize.active,
        removeImage: false,
    };
}

export default function PrizeManager({ initialPrizes }: { initialPrizes: OrganizerPrize[] }) {
    const router = useRouter();
    const [deletedImageIds, setDeletedImageIds] = useState<Set<string>>(() => new Set());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<PrizeForm | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [image, setImage] = useState<File | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const prizes = initialPrizes.map((prize) => deletedImageIds.has(prize.id)
        ? { ...prize, image_path: null, image_url: null }
        : prize);

    function startEditing(prize: OrganizerPrize) {
        setEditingId(prize.id);
        setForm(formFromPrize(prize));
        setImage(null);
        setNotice(null);
        setError(null);
    }

    function cancelEditing() {
        setEditingId(null);
        setForm(null);
        setImage(null);
        setIsCreating(false);
    }

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!form) return;
        setNotice(null);
        setError(null);
        const data = new FormData();
        data.set("name", form.name);
        data.set("description", form.description);
        data.set("pointsRequired", form.pointsRequired);
        data.set("quantity", form.quantity);
        data.set("maxRedemptions", form.maxRedemptions);
        data.set("active", String(form.active));
        data.set("removeImage", String(form.removeImage));
        if (image) data.set("image", image);

        startTransition(async () => {
            try {
                if (!isCreating && editingId) data.set("id", editingId);
                const result = isCreating
                    ? await createOrganizerPrize(data)
                    : await updateOrganizerPrize(data);
                if (!result.success) {
                    setError(result.error);
                    return;
                }
                if (editingId) {
                    setDeletedImageIds((current) => {
                        const next = new Set(current);
                        next.delete(editingId);
                        return next;
                    });
                }
                setNotice(isCreating ? "Prize added." : "Prize updated.");
                cancelEditing();
                router.refresh();
            } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Could not save prize.");
            }
        });
    }

    function startCreating() {
        setEditingId(null);
        setForm({
            name: "",
            description: "",
            pointsRequired: "1",
            quantity: "",
            maxRedemptions: "",
            active: true,
            removeImage: false,
        });
        setImage(null);
        setIsCreating(true);
        setNotice(null);
        setError(null);
    }

    function removePrize(prize: OrganizerPrize) {
        if (!window.confirm(`Delete "${prize.name}"? This cannot be undone.`)) return;
        setNotice(null);
        setError(null);
        startTransition(async () => {
            try {
                const result = await deleteOrganizerPrize(prize.id);
                if (!result.success) {
                    setError(result.error);
                    return;
                }
                setNotice("Prize deleted.");
                router.refresh();
            } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Could not delete prize.");
            }
        });
    }

    function removeImage(prize: OrganizerPrize) {
        if (!window.confirm(`Delete the image for "${prize.name}"?`)) return;
        setNotice(null);
        setError(null);
        startTransition(async () => {
            try {
                const result = await deleteOrganizerPrizeImage(prize.id);
                if (!result.success) {
                    setError(result.error);
                    return;
                }
                setDeletedImageIds((current) => new Set(current).add(prize.id));
                setNotice("Prize image deleted.");
                if (editingId === prize.id) setForm((current) => current ? { ...current, removeImage: true } : current);
                router.refresh();
            } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Could not delete image.");
            }
        });
    }

    function updateField(field: keyof PrizeForm, value: string | boolean) {
        setForm((current) => current ? { ...current, [field]: value } : current);
    }

    return (
        <section>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold text-neutral-900">Point prizes</h2>
                    <p className="mt-1 text-sm text-neutral-600">Manage what participants can redeem with points, including images.</p>
                </div>
                <button type="button" onClick={startCreating} disabled={isPending} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50">
                    Add prize
                </button>
            </div>
            {notice ? <p role="status" className="mb-4 text-sm text-neutral-700">{notice}</p> : null}
            {error ? <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
            {isCreating && form ? (
                <form onSubmit={submit} className="mb-4 space-y-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-neutral-900">Add prize</h3>
                        <button type="button" onClick={cancelEditing} className="text-sm text-neutral-500 hover:text-neutral-900">Cancel</button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm font-medium text-neutral-700">Name<input value={form.name} onChange={(event) => updateField("name", event.target.value)} className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 font-normal text-neutral-900" required /></label>
                        <label className="text-sm font-medium text-neutral-700">Points required<input type="number" min="1" value={form.pointsRequired} onChange={(event) => updateField("pointsRequired", event.target.value)} className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 font-normal text-neutral-900" required /></label>
                        <label className="text-sm font-medium text-neutral-700">Quantity <span className="font-normal text-neutral-500">(blank = unlimited)</span><input type="number" min="0" value={form.quantity} onChange={(event) => updateField("quantity", event.target.value)} className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 font-normal text-neutral-900" /></label>
                        <label className="text-sm font-medium text-neutral-700">Max redemptions per participant <span className="font-normal text-neutral-500">(blank = unlimited)</span><input type="number" min="1" value={form.maxRedemptions} onChange={(event) => updateField("maxRedemptions", event.target.value)} className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 font-normal text-neutral-900" /></label>
                    </div>
                    <label className="block text-sm font-medium text-neutral-700">Description<textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={3} className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 font-normal text-neutral-900" /></label>
                    <label className="block text-sm font-medium text-neutral-700">Image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setImage(event.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm font-normal text-neutral-700" /><span className="mt-1 block font-normal text-neutral-500">JPEG, PNG, WebP, or GIF up to 10 MB.</span></label>
                    <label className="flex items-center gap-2 text-sm text-neutral-700"><input type="checkbox" checked={form.active} onChange={(event) => updateField("active", event.target.checked)} />Active in participant shop</label>
                    <button type="submit" disabled={isPending} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50">{isPending ? "Saving..." : "Add prize"}</button>
                </form>
            ) : null}
            <div className="space-y-3">
                {prizes.map((prize) => (
                    <article key={prize.id} className="rounded-lg border border-neutral-200 p-4">
                        {editingId === prize.id && form ? (
                            <form onSubmit={submit} className="space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="font-semibold text-neutral-900">Edit prize</h3>
                                    <button type="button" onClick={cancelEditing} className="text-sm text-neutral-500 hover:text-neutral-900">Cancel</button>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <label className="text-sm font-medium text-neutral-700">Name<input value={form.name} onChange={(event) => updateField("name", event.target.value)} className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 font-normal text-neutral-900" required /></label>
                                    <label className="text-sm font-medium text-neutral-700">Points required<input type="number" min="1" value={form.pointsRequired} onChange={(event) => updateField("pointsRequired", event.target.value)} className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 font-normal text-neutral-900" required /></label>
                                    <label className="text-sm font-medium text-neutral-700">Quantity <span className="font-normal text-neutral-500">(blank = unlimited)</span><input type="number" min="0" value={form.quantity} onChange={(event) => updateField("quantity", event.target.value)} className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 font-normal text-neutral-900" /></label>
                                    <label className="text-sm font-medium text-neutral-700">Max redemptions per participant <span className="font-normal text-neutral-500">(blank = unlimited)</span><input type="number" min="1" value={form.maxRedemptions} onChange={(event) => updateField("maxRedemptions", event.target.value)} className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 font-normal text-neutral-900" /></label>
                                </div>
                                <label className="block text-sm font-medium text-neutral-700">Description<textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={3} className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 font-normal text-neutral-900" /></label>
                                <label className="block text-sm font-medium text-neutral-700">Image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { setImage(event.target.files?.[0] ?? null); updateField("removeImage", false); }} className="mt-1 block w-full text-sm font-normal text-neutral-700" /><span className="mt-1 block font-normal text-neutral-500">JPEG, PNG, WebP, or GIF up to 10 MB.</span></label>
                                <label className="flex items-center gap-2 text-sm text-neutral-700"><input type="checkbox" checked={form.removeImage} onChange={(event) => updateField("removeImage", event.target.checked)} disabled={!prize.image_path && !image} />Remove current image</label>
                                <label className="flex items-center gap-2 text-sm text-neutral-700"><input type="checkbox" checked={form.active} onChange={(event) => updateField("active", event.target.checked)} />Active in participant shop</label>
                                <button type="submit" disabled={isPending} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50">{isPending ? "Saving..." : "Save prize"}</button>
                            </form>
                        ) : (
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex min-w-0 gap-4">
                                    {prize.image_url ? <img src={prize.image_url} alt="" className="h-20 w-20 rounded-md border border-neutral-200 object-cover" /> : <div className="h-20 w-20 rounded-md bg-neutral-100" />}
                                    <div>
                                        <h3 className="font-semibold text-neutral-900">{prize.name}</h3>
                                        <p className="mt-1 text-sm text-neutral-600">{prize.points_required} points · {prize.quantity == null ? "Unlimited quantity" : `${prize.quantity} available`} · {prize.active ? "Active" : "Inactive"}</p>
                                        {prize.description ? <p className="mt-2 max-w-2xl text-sm text-neutral-600">{prize.description}</p> : null}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {prize.image_path ? <button type="button" onClick={() => removeImage(prize)} disabled={isPending} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50">Delete image</button> : null}
                                    <button type="button" onClick={() => startEditing(prize)} className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800">Edit</button>
                                    <button type="button" onClick={() => removePrize(prize)} disabled={isPending} className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50">Delete prize</button>
                                </div>
                            </div>
                        )}
                    </article>
                ))}
            </div>
        </section>
    );
}
