import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { supabase, supabaseConfigured } from "../supabaseClient";

const LOGIN_URL = "https://samiryasar14.github.io/ai-usage-tracker/#/login";

export function LoginGate() {
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set up listening for the callback on mount (not inside the click handler)
  // so we still catch the tokens if a login was already in flight before this
  // component mounted.
  useEffect(() => {
    const unsubscribe = window.electronAPI?.onAuthCallback(({ accessToken, refreshToken }) => {
      setWaiting(false);
      if (!supabase) return;
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error: err }) => {
        if (err) setError(err.message);
      });
    });

    return () => unsubscribe?.();
  }, []);

  async function handleLogin() {
    setError(null);
    setWaiting(true);
    try {
      await window.electronAPI!.openExternal(LOGIN_URL);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't open your browser.");
      setWaiting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-plane px-6">
      <div className="w-full max-w-sm rounded-lg border border-hairline bg-surface p-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <Sparkles size={20} className="text-text-secondary" />
          <span className="text-lg font-semibold text-text-primary">AI Usage Hub</span>
        </div>

        <p className="mt-3 text-sm text-text-secondary">Log in to AI Usage Hub</p>

        {!supabaseConfigured ? (
          <p className="mt-6 rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-600">
            Sign-in isn&apos;t configured yet.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={handleLogin}
              disabled={waiting}
              className="mt-6 w-full rounded-md bg-text-primary px-3 py-1.5 text-sm font-medium text-surface transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
            >
              Log in in your browser
            </button>

            {waiting && (
              <p className="mt-4 flex items-center justify-center gap-2 text-sm text-text-muted">
                <Loader2 size={14} className="animate-spin" />
                Waiting for you to finish logging in…
              </p>
            )}

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
