import React from "react";

export function Badge({ children }: { children: React.ReactNode; tone?: string }) {
  return <span>{children}</span>;
}

export function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <strong className="mt-2 block text-2xl text-slate-900">{value}</strong>
      {detail && <small className="mt-1 block text-xs text-slate-500">{detail}</small>}
    </div>
  );
}

export function Header({ title, description, action }: {
  label: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </header>
  );
}

export function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <dl className="border-b border-slate-200 py-3 last:border-0">
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-700">{value || "Not provided"}</dd>
    </dl>
  );
}
