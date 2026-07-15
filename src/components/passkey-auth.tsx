"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import { IconKey } from "@tabler/icons-react";

export function PasskeyLoginButton({ email }: { email?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function login() {
    setLoading(true);
    setError("");

    try {
      const beginRes = await fetch("/api/auth/passkey/login/begin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const opts = await beginRes.json();
      if (!beginRes.ok) {
        setError(opts.error ?? "Failed to start passkey login");
        return;
      }

      const authResp = await startAuthentication(opts);

      const completeRes = await fetch("/api/auth/passkey/login/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authResp),
      });
      const result = await completeRes.json();
      if (!completeRes.ok) {
        setError(result.error ?? "Passkey verification failed");
        return;
      }

      router.refresh();
      router.push(result.role === "poster" ? "/poster" : "/buyer");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        onClick={login}
        disabled={loading}
        className="w-full gap-2"
      >
        <IconKey className="size-4" />
        {loading ? "Checking passkey..." : "Sign in with passkey"}
      </Button>
      {error && (
        <p className="mt-2 text-xs text-destructive text-center">{error}</p>
      )}
    </div>
  );
}

export function PasskeyRegisterButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function register() {
    setLoading(true);
    setError("");

    try {
      const beginRes = await fetch("/api/auth/passkey/register/begin", {
        method: "POST",
      });
      const opts = await beginRes.json();
      if (!beginRes.ok) {
        setError(opts.error ?? "Failed to start registration");
        return;
      }

      const regResp = await startRegistration(opts);

      const completeRes = await fetch("/api/auth/passkey/register/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regResp),
      });
      const result = await completeRes.json();
      if (!completeRes.ok) {
        setError(result.error ?? "Registration failed");
        return;
      }

      setDone(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="text-xs text-primary text-center">
        Passkey registered successfully.
      </p>
    );
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={register}
        disabled={loading}
        className="gap-2"
      >
        <IconKey className="size-3" />
        {loading ? "Registering..." : "Register a passkey"}
      </Button>
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}