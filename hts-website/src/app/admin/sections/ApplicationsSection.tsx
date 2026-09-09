import React, { useState } from "react";
import { Application, Status } from "../types";
import { Detail, Header } from "../components/Common";

type Props = {
  applications: Application[];
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  applicationId: string | null;
  setApplicationId: (id: string | null) => void;
};

export default function ApplicationsSection({
  applications,
  setApplications,
  applicationId,
  setApplicationId,
}: Props) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All types");
  const [statusFilter, setStatusFilter] = useState("All statuses");

  const filtered = applications.filter((item) => {
    const matchesQuery = `${item.name} ${item.email} ${item.role}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesRole =
      roleFilter === "All types" || item.role === roleFilter;
    const matchesStatus =
      statusFilter === "All statuses" || item.status === statusFilter;
    return matchesQuery && matchesRole && matchesStatus;
  });

  const selected = applications.find((item) => item.id === applicationId);

  return (
    <>
      <Header
        label="Admissions"
        title="Applications"
        description={`${applications.length} applications across hackers, judges, and mentors.`}
      />
      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:flex-row sm:items-center">
        <input
          className="min-w-0 flex-1"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name or email"
        />
        <select
          className="sm:min-w-36"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option>All types</option>
          <option>Hacker</option>
          <option>Judge</option>
          <option>Mentor</option>
        </select>
        <select
          className="sm:min-w-40"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All statuses</option>
          <option>Pending</option>
          <option>Accepted</option>
          <option>Waitlist</option>
          <option>Rejected</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table>
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Type</th>
              <th>Submitted</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>
                  <button
                    className="text-left font-medium text-amber-700 hover:text-amber-900"
                    onClick={() => setApplicationId(item.id)}
                  >
                    <span className="block min-w-48">
                      <strong className="block text-sm font-semibold text-slate-900">{item.name}</strong>
                      <small className="mt-1 block text-xs text-slate-500">{item.email}</small>
                    </span>
                  </button>
                </td>
                <td>{item.role}</td>
                <td>{item.submitted}</td>
                <td>
                  <select
                    className="min-w-28"
                    value={item.status}
                    onChange={(event) =>
                      setApplications((current) =>
                        current.map((row) =>
                          row.id === item.id
                            ? { ...row, status: event.target.value as Status }
                            : row,
                        ),
                      )
                    }
                  >
                    <option>Pending</option>
                    <option>Accepted</option>
                    <option>Waitlist</option>
                    <option>Rejected</option>
                  </select>
                </td>
                <td>
                  <button
                    className="text-sm font-medium text-amber-700 hover:text-amber-900"
                    onClick={() => setApplicationId(item.id)}
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-slate-400">
                  No applications match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {selected && (
        <div className="fixed inset-0 z-40 bg-slate-950/70 p-4" onClick={() => setApplicationId(null)}>
          <aside
            className="ml-auto h-full max-w-xl overflow-y-auto bg-slate-900 p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="rounded-md px-2 py-1 text-2xl text-slate-400 hover:bg-slate-800 hover:text-white" onClick={() => setApplicationId(null)}>
              Close
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">{selected.role} application</p>
            <h2>{selected.name}</h2>
            <p className="text-sm text-slate-400">
              {selected.email} · Submitted {selected.submitted}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <select
                value={selected.status}
                onChange={(event) => {
                  const status = event.target.value as Status;
                  setApplications((current) =>
                    current.map((row) =>
                      row.id === selected.id ? { ...row, status } : row,
                    ),
                  );
                }}
              >
                <option>Pending</option>
                <option>Accepted</option>
                <option>Waitlist</option>
                <option>Rejected</option>
              </select>
              <span>{selected.status}</span>
            </div>
            <div className="mt-6">
              {selected.role === "Hacker" ? (
                <>
                  <Detail label="School" value={selected.school} />
                  <Detail
                    label="Grade / graduation"
                    value={`${selected.grade} · ${selected.year}`}
                  />
                  <Detail label="School city" value={selected.city} />
                  <Detail label="High-school enrollment" value="Confirmed" />
                  <Detail
                    label="Parent / emergency contact"
                    value="On file"
                  />
                  <Detail
                    label="Hackathon experience"
                    value={selected.experience}
                  />
                  <Detail label="Resume" value="resume-placeholder.pdf" />
                  <Detail
                    label="Application question"
                    value={selected.question}
                  />
                </>
              ) : (
                <>
                  <Detail label="Company" value={selected.company} />
                  <Detail label="Specialty" value={selected.specialty} />
                  <Detail label="Motivation" value={selected.motivation} />
                  <Detail label="Resume" value="resume-placeholder.pdf" />
                  <Detail
                    label="Eligibility confirmation"
                    value="Confirmed"
                  />
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
