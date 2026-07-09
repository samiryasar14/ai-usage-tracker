import { useState } from "react";
import { X } from "lucide-react";
import type { SavedView, Tag } from "../api";

export interface FilterConfig {
  search: string;
  minCost: number | null;
  tagId: string | null;
}

export const DEFAULT_FILTER_CONFIG: FilterConfig = { search: "", minCost: null, tagId: null };

interface FilterBarProps {
  filterConfig: FilterConfig;
  onChange: (config: FilterConfig) => void;
  tags: Tag[];
  savedViews: SavedView[];
  onLoadView: (config: FilterConfig) => void;
  onSaveView: (name: string) => void;
  onDeleteView: (id: string) => void;
}

const inputClass =
  "rounded-md border border-hairline bg-transparent px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface";
const primaryButtonClass =
  "rounded-md bg-text-primary px-3 py-1.5 text-sm font-medium text-surface transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50";

const hasActiveFilters = (config: FilterConfig) =>
  config.search.trim() !== "" || config.minCost !== null || config.tagId !== null;

/**
 * Generic CRM-style filter bar: text search, a numeric min-cost floor, a tag
 * filter, and CRUD for named "saved views" of the current filter shape.
 * Deliberately shape-agnostic (no Projects-specific fields) so a future pass
 * can reuse it for Sessions filtering too.
 */
export function FilterBar({
  filterConfig,
  onChange,
  tags,
  savedViews,
  onLoadView,
  onSaveView,
  onDeleteView,
}: FilterBarProps) {
  const [selectedViewId, setSelectedViewId] = useState("");
  const [newViewName, setNewViewName] = useState("");

  function handleLoadView(id: string) {
    setSelectedViewId(id);
    if (!id) return;
    const view = savedViews.find((v) => v.id === id);
    if (!view) return;
    try {
      const parsed = JSON.parse(view.filterConfig) as FilterConfig;
      onLoadView(parsed);
    } catch {
      // malformed saved filter config — ignore rather than crash the view
    }
  }

  function handleDeleteView(id: string) {
    onDeleteView(id);
    if (selectedViewId === id) setSelectedViewId("");
  }

  function handleSaveView() {
    const trimmed = newViewName.trim();
    if (!trimmed) return;
    onSaveView(trimmed);
    setNewViewName("");
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        Search
        <input
          type="text"
          value={filterConfig.search}
          onChange={(e) => onChange({ ...filterConfig, search: e.target.value })}
          placeholder="Project name…"
          className={`w-44 ${inputClass}`}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        Min cost
        <input
          type="number"
          min={0}
          step="0.01"
          value={filterConfig.minCost ?? ""}
          onChange={(e) =>
            onChange({
              ...filterConfig,
              minCost: e.target.value === "" ? null : Number(e.target.value),
            })
          }
          placeholder="$0.00"
          className={`w-24 ${inputClass}`}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        Tag
        <select
          value={filterConfig.tagId ?? ""}
          onChange={(e) => onChange({ ...filterConfig, tagId: e.target.value || null })}
          className={`w-36 ${inputClass}`}
        >
          <option value="">All tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
      </label>

      {hasActiveFilters(filterConfig) && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_FILTER_CONFIG)}
          className="pb-1.5 text-sm text-text-muted hover:text-text-primary"
        >
          Clear filters
        </button>
      )}

      <label className="flex flex-col gap-1 text-sm text-text-secondary">
        Saved views
        <select
          value={selectedViewId}
          onChange={(e) => handleLoadView(e.target.value)}
          className={`w-40 ${inputClass}`}
        >
          <option value="">Select a view…</option>
          {savedViews.map((view) => (
            <option key={view.id} value={view.id}>
              {view.name}
            </option>
          ))}
        </select>
      </label>

      {savedViews.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pb-1.5">
          {savedViews.map((view) => (
            <span
              key={view.id}
              className="flex items-center gap-1 rounded-md border border-hairline px-2 py-1 text-xs text-text-secondary"
            >
              {view.name}
              <button
                type="button"
                onClick={() => handleDeleteView(view.id)}
                aria-label={`Delete saved view "${view.name}"`}
                className="rounded-sm text-text-muted transition-colors hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveView();
        }}
      >
        <label className="flex flex-col gap-1 text-sm text-text-secondary">
          Save current filter as…
          <input
            type="text"
            value={newViewName}
            onChange={(e) => setNewViewName(e.target.value)}
            placeholder="View name"
            className={`w-36 ${inputClass}`}
          />
        </label>
        <button type="submit" disabled={!newViewName.trim()} className={primaryButtonClass}>
          Save
        </button>
      </form>
    </div>
  );
}
