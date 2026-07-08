import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Smartphone, UserCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { ComponentType, ReactNode } from "react";
import { api, type PairingSession } from "../api";
import { supabase, supabaseConfigured } from "../supabaseClient";

interface SectionHeadingProps {
  icon: ComponentType<{ size?: string | number; className?: string }>;
  children: ReactNode;
}

function SectionHeading({ icon: Icon, children }: SectionHeadingProps) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-medium text-text-secondary">
      <Icon size={16} className="text-text-secondary" />
      {children}
    </h2>
  );
}

export function SettingsView() {
  const [loggingOut, setLoggingOut] = useState(false);

  const user = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      if (!supabase) return null;
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
    enabled: supabaseConfigured,
  });

  async function handleLogout() {
    if (!supabase) return;
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setLoggingOut(false);
    }
  }

  const queryClient = useQueryClient();

  const [pairingSession, setPairingSession] = useState<PairingSession | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!pairingSession) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [pairingSession]);

  const startPairing = useMutation({
    mutationFn: api.startPairing,
    onSuccess: (data) => setPairingSession(data),
  });

  const devices = useQuery({
    queryKey: ["pairedDevices"],
    queryFn: api.pairedDevices,
    refetchInterval: 15_000,
  });

  const revokeDevice = useMutation({
    mutationFn: api.revokeDevice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pairedDevices"] }),
  });

  const pairingExpired = pairingSession ? now >= pairingSession.expiresAt : false;
  const pairingUrl =
    pairingSession && pairingSession.host
      ? `ai-usage-hub://pair?host=${encodeURIComponent(pairingSession.host)}&port=${encodeURIComponent(
          String(pairingSession.port),
        )}&code=${encodeURIComponent(pairingSession.code)}`
      : null;
  const remainingMs = pairingSession ? Math.max(0, pairingSession.expiresAt - now) : 0;
  const remainingMinutes = Math.floor(remainingMs / 60_000);
  const remainingSeconds = Math.floor((remainingMs % 60_000) / 1000);

  const generateButton = (
    <button
      type="button"
      onClick={() => startPairing.mutate()}
      disabled={startPairing.isPending}
      className="rounded-md bg-text-primary px-3 py-1.5 text-sm font-medium text-surface transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
    >
      {startPairing.isPending ? "Generating…" : "Generate pairing code"}
    </button>
  );

  return (
    <div>
      <section className="rounded-lg border border-hairline bg-surface p-5">
        <SectionHeading icon={UserCircle}>Account</SectionHeading>
        <div className="mt-3">
          {!supabaseConfigured ? (
            <p className="text-sm text-text-muted">Sign-in isn&apos;t configured yet.</p>
          ) : user.isLoading ? (
            <p className="text-sm text-text-muted">Loading account…</p>
          ) : user.isError ? (
            <p className="text-sm text-red-600">Couldn&apos;t load account details.</p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm text-text-secondary">Signed in as</div>
                <div className="mt-0.5 text-base font-medium text-text-primary">{user.data?.email ?? "Unknown"}</div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-md bg-text-primary px-3 py-1.5 text-sm font-medium text-surface transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
              >
                {loggingOut ? "Logging out…" : "Log out"}
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-hairline bg-surface p-5">
        <SectionHeading icon={Smartphone}>Pair a Mobile Device</SectionHeading>
        <div className="mt-3">
          {pairingSession && !pairingExpired ? (
            pairingSession.host ? (
              <div className="flex flex-col items-center gap-3 py-2">
                <QRCodeSVG value={pairingUrl as string} size={180} />
                <div className="text-2xl font-semibold tracking-widest text-text-primary">{pairingSession.code}</div>
                <div className="text-sm text-text-muted">
                  Expires in {remainingMinutes}m {remainingSeconds}s
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-red-600">
                  Couldn&apos;t determine this computer&apos;s network address — make sure you&apos;re connected to
                  WiFi and try again.
                </p>
                {generateButton}
              </div>
            )
          ) : (
            <div className="flex flex-col items-start gap-3">
              {pairingSession && pairingExpired && (
                <p className="text-sm text-text-muted">Pairing code expired. Generate a new one to continue.</p>
              )}
              {generateButton}
            </div>
          )}
        </div>

        <div className="mt-5 border-t border-hairline pt-4">
          <div className="text-sm text-text-secondary">Paired devices</div>
          <ul className="mt-3 space-y-2">
            {devices.data?.map((device) => (
              <li
                key={device.id}
                className="flex items-center justify-between rounded-md border border-hairline px-3 py-2 text-sm"
              >
                <div>
                  <div className="text-text-primary">{device.name}</div>
                  <div className="text-text-muted">Last seen {new Date(device.lastSeenAt).toLocaleString()}</div>
                </div>
                <button
                  type="button"
                  onClick={() => revokeDevice.mutate(device.id)}
                  disabled={revokeDevice.isPending}
                  className="rounded-sm text-xs text-text-muted transition-colors hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
                >
                  Revoke
                </button>
              </li>
            ))}
            {(devices.data?.length ?? 0) === 0 && (
              <li className="rounded-md border border-dashed border-hairline px-3 py-4 text-center text-sm text-text-muted">
                No devices paired yet.
              </li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
