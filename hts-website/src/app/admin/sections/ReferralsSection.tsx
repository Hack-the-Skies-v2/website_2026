import React from "react";
import { Referral, User } from "../types";
import { Header, Stat } from "../components/Common";

type Props = {
  referrals: Referral[];
  users: User[];
};

export default function ReferralsSection({ referrals, users }: Props) {
  const person = (id: string) => users.find((user) => user.id === id);

  return (
    <>
      <Header
        label="Growth"
        title="Referrals"
        description="See who brought new participants into the event."
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total referrals" value={referrals.length} />
        <Stat
          label="Active referrers"
          value={new Set(referrals.map((item) => item.referrerId)).size}
        />
        <Stat
          label="Referral points"
          value={referrals.reduce((sum, item) => sum + item.points, 0)}
        />
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table>
          <thead>
            <tr>
              <th>Referrer</th>
              <th>Referred participant</th>
              <th>Created</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((item) => (
              <tr key={item.referredId}>
                <td>{person(item.referrerId)?.name}</td>
                <td>{person(item.referredId)?.name}</td>
                <td>{item.date}</td>
                <td>+{item.points}</td>
              </tr>
            ))}
            {referrals.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-sm text-slate-400">
                  No referrals tracked yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
