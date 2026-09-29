"use client";

import { useEffect } from "react";

export default function OrganizersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.body.classList.add("no-stars");
    return () => {
      document.body.classList.remove("no-stars");
    };
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-neutral-900 antialiased">
      {children}
    </div>
  );
}
