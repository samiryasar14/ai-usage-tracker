import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserCircle } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
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
    </div>
  );
}
