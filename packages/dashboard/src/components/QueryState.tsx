import type { ReactNode } from "react";

interface QueryStateProps {
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  children: ReactNode;
}

/** Shared loading/error wrapper for panels backed by a single React Query call — table/list empty states are still handled by each panel itself. */
export function QueryState({ isLoading, isError, onRetry, children }: QueryStateProps) {
  if (isLoading) {
    return <div className="animate-pulse py-6 text-center text-sm text-text-muted">Loading…</div>;
  }

  if (isError) {
    return (
      <div className="flex items-center justify-between rounded-md border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-600">
        <span>Couldn&apos;t load this data.</span>
        <button type="button" onClick={onRetry} className="ml-4 font-medium">
          Retry
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
