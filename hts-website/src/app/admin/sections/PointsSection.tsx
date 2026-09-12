import React, { useState, type SubmitEvent } from "react";
import { Transaction, User } from "../types";
import { Header } from "../components/Common";

type Props = {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  notify: (msg: string) => void;
};

export default function PointsSection({
  users,
  setUsers,
  transactions,
  setTransactions,
  notify,
}: Props) {
  const [pointUser, setPointUser] = useState(users[0]?.id ?? "");
  const [amount, setAmount] = useState(10);

  const person = (id: string) => users.find((user) => user.id === id);

  const adjust = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTransactions((current) => [
      ...current,
      {
        id: `p${Date.now()}`,
        userId: pointUser,
        type: "admin",
        amount,
        date: "Sep 08, 2026",
        reference: "Manual admin adjustment",
        adminName: "Casey Morgan",
      },
    ]);
    setUsers((current) =>
      current.map((user) =>
        user.id === pointUser
          ? { ...user, points: user.points + amount }
          : user,
      ),
    );
    notify("Points adjusted");
  };

  return (
    <>
      <Header
        label="Engagement"
        title="Points"
        description="Balances come from workshop, referral, and admin transactions only."
      />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Balance</th>
                <th>Transactions</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter((user) => user.role === "Hacker")
                .map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>
                      <strong>{user.points}</strong>
                    </td>
                    <td>
                      {
                        transactions.filter((item) => item.userId === user.id)
                          .length
                      }
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <h3>Admin adjustment</h3>
          <p className="text-sm text-slate-400">Recorded under Casey Morgan.</p>
          <form onSubmit={adjust}>
            <select
              value={pointUser}
              onChange={(event) => setPointUser(event.target.value)}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="number"
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
              />
              <button className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200">Apply points</button>
            </div>
          </form>
        </div>
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Reference</th>
              <th>Admin</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((item) => (
              <tr key={item.id}>
                <td>{person(item.userId)?.name}</td>
                <td>{item.type}</td>
                <td className="text-emerald-400">
                  {item.amount >= 0 ? "+" : ""}
                  {item.amount}
                </td>
                <td>{item.reference}</td>
                <td>{item.adminName || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
