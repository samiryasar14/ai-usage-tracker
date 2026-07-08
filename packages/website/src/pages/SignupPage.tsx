import type { FormEvent } from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { GITHUB_RELEASES_URL } from "../constants";
import { supabase, supabaseConfigured } from "../supabaseClient";

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    setError(null);
    setNeedsEmailConfirmation(false);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    const session = data.session;
    if (!session) {
      setNeedsEmailConfirmation(true);
      return;
    }

    const url = `ai-usage-hub://auth-callback?access_token=${encodeURIComponent(
      session.access_token,
    )}&refresh_token=${encodeURIComponent(session.refresh_token)}`;
    setCallbackUrl(url);
    window.location.href = url;
  }

  return (
    <section className="mx-auto flex max-w-6xl justify-center px-6 py-20 sm:py-28">
      <div className="w-full max-w-sm rounded-xl border border-hairline bg-surface px-6 py-8 sm:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Sign up</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Create an account, then hand off your session to the AI Usage Hub desktop app.
        </p>

        {!supabaseConfigured ? (
          <p className="mt-6 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
            Sign-in isn&apos;t configured yet — check back soon.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-text-secondary">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-hairline bg-plane px-3 py-2 text-sm text-text-primary outline-none focus:border-series-1"
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-text-secondary">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-hairline bg-plane px-3 py-2 text-sm text-text-primary outline-none focus:border-series-1"
              />
            </div>
            <div>
              <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-text-secondary">
                Confirm password
              </label>
              <input
                id="signup-confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-hairline bg-plane px-3 py-2 text-sm text-text-primary outline-none focus:border-series-1"
              />
            </div>

            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-text-primary px-6 py-3 text-sm font-semibold text-plane shadow-lg shadow-text-primary/10 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              {submitting ? "Signing up…" : "Sign up"}
            </button>
          </form>
        )}

        {needsEmailConfirmation && (
          <p className="mt-6 rounded-lg border border-hairline bg-plane px-4 py-3 text-sm text-text-secondary">
            Check your email to confirm your account, then log in.
          </p>
        )}

        {callbackUrl && (
          <div className="mt-6 space-y-3 border-t border-hairline pt-6">
            <p className="text-sm text-text-secondary">If AI Usage Hub didn&apos;t open automatically:</p>
            <a
              href={callbackUrl}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-hairline bg-plane px-6 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-text-primary/[0.04]"
            >
              Open AI Usage Hub
            </a>
            <p className="text-center text-xs text-text-muted">
              Don&apos;t have the app yet?{" "}
              <a
                href={GITHUB_RELEASES_URL}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-text-secondary underline underline-offset-2 hover:text-text-primary"
              >
                Download it
              </a>
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-text-primary underline underline-offset-2">
            Log in
          </Link>
        </p>
      </div>
    </section>
  );
}
