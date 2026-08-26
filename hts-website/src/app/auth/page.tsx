"use client";

import { useState } from "react";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <main>
      <h1 className="text-center justify-center font-outfit text-5xl md:text-6xl lg:text-7xl font-semibold text-primary">
        Soon
      </h1>
    </main>
  );
}
