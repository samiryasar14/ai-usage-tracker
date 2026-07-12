import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, DatabaseBackup, FileDown, FolderOpen, Plug, Smartphone, UserCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { ComponentType, ReactNode } from "react";
import { api, type PairingSession, type ReportFormat, type ReportPeriod } from "../api";
import { ProviderCard } from "../components/ProviderCard";

const isElectron = window.electronAPI?.isElectron === true;

const PROFILE_NAME_KEY = "profileName";

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
  const [profileName, setProfileName] = useState(() => localStorage.getItem(PROFILE_NAME_KEY) ?? "");
  const [nameDraft, setNameDraft] = useState(profileName);
  const [editingName, setEditingName] = useState(profileName === "");

  function saveName() {
    const trimmed = nameDraft.trim();
    localStorage.setItem(PROFILE_NAME_KEY, trimmed);
    setProfileName(trimmed);
    setEditingName(false);
  }

  const queryClient = useQueryClient();

  const settings = useQuery({ queryKey: ["settings"], queryFn: api.settings });

  const setSetting = useMutation({
    mutationFn: ({ key, value }: { key: Parameters<typeof api.setSetting>[0]; value: string }) =>
      api.setSetting(key, value),
    onSuccess: (data) => queryClient.setQueryData(["settings"], data),
  });

  const retentionDays = settings.data?.dataRetentionDays ?? "0";
  const notifyOnBudgetAlert = settings.data?.notifyOnBudgetAlert !== "false";
  const defaultReportPeriod = (settings.data?.defaultReportPeriod as ReportPeriod) ?? "month";
  const defaultReportFormat = (settings.data?.defaultReportFormat as ReportFormat) ?? "csv";

  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  const backupDatabase = useMutation({
    mutationFn: () => window.electronAPI!.backupDatabase(),
    onSuccess: (result) => setBackupMessage(result.ok ? "Backup saved." : result.error),
  });

  const providers = useQuery({ queryKey: ["providers"], queryFn: api.providers, refetchInterval: 30_000 });

  const toggleProvider = useMutation({
    mutationFn: ({ name, enabled }: { name: string; enabled: boolean }) => api.setProviderEnabled(name, enabled),
    onSuccess: (data) => queryClient.setQueryData(["providers"], data),
  });

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
        <SectionHeading icon={UserCircle}>Your name</SectionHeading>
        <div className="mt-3">
          {editingName ? (
            <form
              className="flex flex-wrap items-center gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                saveName();
              }}
            >
              <input
                type="text"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="What should we call you?"
                autoFocus
                className="w-64 rounded-md border border-hairline bg-transparent px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface"
              />
              <button
                type="submit"
                disabled={!nameDraft.trim()}
                className="rounded-md bg-text-primary px-3 py-1.5 text-sm font-medium text-surface transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
              >
                Save
              </button>
              {profileName && (
                <button
                  type="button"
                  onClick={() => {
                    setNameDraft(profileName);
                    setEditingName(false);
                  }}
                  className="text-sm text-text-muted hover:text-text-primary"
                >
                  Cancel
                </button>
              )}
            </form>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-base font-medium text-text-primary">{profileName}</div>
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="rounded-md bg-text-primary px-3 py-1.5 text-sm font-medium text-surface transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface"
              >
                Edit
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

      {isElectron && (
        <section className="mt-8 rounded-lg border border-hairline bg-surface p-5">
          <SectionHeading icon={DatabaseBackup}>App Data</SectionHeading>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setBackupMessage(null);
                backupDatabase.mutate();
              }}
              disabled={backupDatabase.isPending}
              className="flex items-center gap-1.5 rounded-md bg-text-primary px-3 py-1.5 text-sm font-medium text-surface transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
            >
              <DatabaseBackup size={15} />
              {backupDatabase.isPending ? "Saving…" : "Backup Database"}
            </button>
            <button
              type="button"
              onClick={() => window.electronAPI!.openDataFolder()}
              className="flex items-center gap-1.5 rounded-md border border-hairline px-3 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-plane focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface"
            >
              <FolderOpen size={15} />
              Open Data Folder
            </button>
            {backupMessage && <span className="text-sm text-text-muted">{backupMessage}</span>}
          </div>
        </section>
      )}

      <section className="mt-8 rounded-lg border border-hairline bg-surface p-5">
        <SectionHeading icon={Bell}>Notifications & data</SectionHeading>
        <div className="mt-3 flex flex-col gap-4">
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={notifyOnBudgetAlert}
              onChange={(e) =>
                setSetting.mutate({ key: "notifyOnBudgetAlert", value: e.target.checked ? "true" : "false" })
              }
              className="accent-series-1 transition-colors focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface"
            />
            Send a desktop notification when a budget alert fires
          </label>

          <label className="flex flex-col gap-1 text-sm text-text-secondary">
            Keep detailed request history for
            <select
              value={retentionDays}
              onChange={(e) => setSetting.mutate({ key: "dataRetentionDays", value: e.target.value })}
              className="w-48 rounded-md border border-hairline bg-transparent px-2 py-1.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface"
            >
              <option value="0">Forever (default)</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="365">365 days</option>
            </select>
            <span className="text-xs text-text-muted">
              Requests older than this are deleted automatically. Aggregated totals for already-elapsed periods
              aren&apos;t affected, but drilling into old sessions won&apos;t be possible.
            </span>
          </label>
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-hairline bg-surface p-5">
        <SectionHeading icon={FileDown}>Export defaults</SectionHeading>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm text-text-secondary">
            Default period
            <select
              value={defaultReportPeriod}
              onChange={(e) => setSetting.mutate({ key: "defaultReportPeriod", value: e.target.value })}
              className="w-40 rounded-md border border-hairline bg-transparent px-2 py-1.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface"
            >
              <option value="day">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">This month</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-text-secondary">
            Default format
            <select
              value={defaultReportFormat}
              onChange={(e) => setSetting.mutate({ key: "defaultReportFormat", value: e.target.value })}
              className="w-32 rounded-md border border-hairline bg-transparent px-2 py-1.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="pdf">PDF</option>
            </select>
          </label>
        </div>
      </section>

      <section className="mt-8 rounded-lg border border-hairline bg-surface p-5">
        <SectionHeading icon={Plug}>Providers</SectionHeading>
        <div className="mt-3 space-y-3">
          {(providers.data ?? []).map((status) => (
            <ProviderCard
              key={status.name}
              status={status}
              togglingEnabled={toggleProvider.isPending && toggleProvider.variables?.name === status.name}
              onToggleEnabled={(enabled) => toggleProvider.mutate({ name: status.name, enabled })}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
