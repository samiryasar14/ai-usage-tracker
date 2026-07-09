import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CircleDollarSign,
  Database,
  MessageSquare,
  Plus,
  StickyNote,
  Tag as TagIcon,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { api } from "../api";
import type { ProjectAnalyticsRow, SessionHistoryRow } from "../api";
import { formatCompact, formatCount, formatCurrency } from "../format";
import { StatCard } from "./StatCard";
import { SessionHistory } from "./SessionHistory";

interface ProjectDetailProps {
  project: ProjectAnalyticsRow;
  /** Session history rows already filtered to this project's path. */
  sessions: SessionHistoryRow[];
  onClose: () => void;
}

const TAG_COLOR_PALETTE = [
  "#22d3ee",
  "#a855f7",
  "#f472b6",
  "#fb923c",
  "#facc15",
  "#4ade80",
  "#60a5fa",
  "#f87171",
];

const inputClasses =
  "rounded-md border border-hairline bg-transparent px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface";
const primaryButtonClasses =
  "rounded-md bg-text-primary px-3 py-1.5 text-sm font-medium text-surface transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50";

export function ProjectDetail({ project, sessions, onClose }: ProjectDetailProps) {
  const queryClient = useQueryClient();

  const recommendation = useQuery({
    queryKey: ["projectRecommendation", project.projectId],
    queryFn: () => api.projectRecommendation(project.projectId),
    enabled: !!project.projectId,
  });

  const tagsQuery = useQuery({ queryKey: ["tags"], queryFn: api.tags });

  const removeTag = useMutation({
    mutationFn: (tagId: string) => api.removeTagFromProject(project.projectId, tagId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const addTag = useMutation({
    mutationFn: (tagId: string) => api.addTagToProject(project.projectId, tagId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const [showNewTagForm, setShowNewTagForm] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLOR_PALETTE[0]);

  const createTag = useMutation({
    mutationFn: async () => {
      const tag = await api.createTag(newTagName.trim(), newTagColor);
      await api.addTagToProject(project.projectId, tag.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      setNewTagName("");
      setNewTagColor(TAG_COLOR_PALETTE[0]);
      setShowNewTagForm(false);
    },
  });

  const availableTags = (tagsQuery.data ?? []).filter(
    (tag) => !project.tags.some((projectTag) => projectTag.id === tag.id),
  );

  const notesQuery = useQuery({
    queryKey: ["projectNotes", project.projectId],
    queryFn: () => api.projectNotes(project.projectId),
  });

  const [noteDraft, setNoteDraft] = useState("");

  const addNote = useMutation({
    mutationFn: (content: string) => api.addProjectNote(project.projectId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectNotes", project.projectId] });
      setNoteDraft("");
    },
  });

  const deleteNote = useMutation({
    mutationFn: (id: string) => api.deleteNote(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projectNotes", project.projectId] }),
  });

  return (
    <div className="mt-6 rounded-lg border border-hairline bg-surface p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-text-primary">{project.name}</h2>
          <p className="mt-0.5 text-sm text-text-secondary" title={project.path}>
            {project.path}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close project detail"
          className="rounded-md p-1 text-text-secondary hover:text-text-primary"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Sessions" value={formatCount(project.sessions)} icon={MessageSquare} />
        <StatCard label="Requests" value={formatCount(project.requests)} icon={Zap} />
        <StatCard label="Tokens" value={formatCompact(project.tokens)} icon={Database} />
        <StatCard label="Cost" value={formatCurrency(project.cost)} icon={CircleDollarSign} />
      </div>

      <div className="mt-6 rounded-lg border border-hairline p-4">
        <h3 className="flex items-center gap-1.5 text-sm font-medium text-text-secondary">
          <TagIcon size={14} />
          Tags
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag.id}
              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => removeTag.mutate(tag.id)}
                disabled={removeTag.isPending}
                aria-label={`Remove tag ${tag.name}`}
                className="rounded-full hover:opacity-75 focus:outline-none disabled:opacity-50"
              >
                <X size={11} />
              </button>
            </span>
          ))}
          {project.tags.length === 0 && <span className="text-sm text-text-muted">No tags yet.</span>}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {availableTags.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) addTag.mutate(e.target.value);
              }}
              disabled={addTag.isPending}
              aria-label="Add tag to project"
              className={`${inputClasses} disabled:opacity-50`}
            >
              <option value="" disabled>
                Add tag…
              </option>
              {availableTags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => setShowNewTagForm((v) => !v)}
            className="flex items-center gap-1 rounded-md border border-hairline px-2.5 py-1.5 text-sm font-medium text-text-primary transition-colors hover:bg-plane focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface"
          >
            <Plus size={13} />
            New tag
          </button>
        </div>

        {showNewTagForm && (
          <form
            className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-hairline p-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newTagName.trim() || createTag.isPending) return;
              createTag.mutate();
            }}
          >
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name"
              autoFocus
              className={`w-40 ${inputClasses}`}
            />
            <div className="flex items-center gap-1.5">
              {TAG_COLOR_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewTagColor(color)}
                  aria-label={`Choose color ${color}`}
                  className={`h-5 w-5 rounded-full focus:outline-none ${
                    newTagColor === color ? "ring-2 ring-series-1 ring-offset-2 ring-offset-surface" : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <button type="submit" disabled={!newTagName.trim() || createTag.isPending} className={primaryButtonClasses}>
              {createTag.isPending ? "Adding…" : "Add tag"}
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-hairline p-4">
        <h3 className="flex items-center gap-1.5 text-sm font-medium text-text-secondary">
          <StickyNote size={14} />
          Notes
        </h3>
        <ul className="mt-3 space-y-2">
          {(notesQuery.data ?? []).map((note) => (
            <li
              key={note.id}
              className="flex items-start justify-between gap-3 rounded-md border border-hairline px-3 py-2 text-sm"
            >
              <div>
                <p className="whitespace-pre-wrap text-text-primary">{note.content}</p>
                <p className="mt-1 text-xs text-text-muted">{new Date(note.createdAt).toLocaleString()}</p>
              </div>
              <button
                type="button"
                onClick={() => deleteNote.mutate(note.id)}
                disabled={deleteNote.isPending}
                aria-label="Delete note"
                className="rounded-sm p-0.5 text-text-muted transition-colors hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-series-1 focus:ring-offset-2 focus:ring-offset-surface disabled:opacity-50"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
          {(notesQuery.data ?? []).length === 0 && <li className="text-sm text-text-muted">No notes yet.</li>}
        </ul>

        <form
          className="mt-3 flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const content = noteDraft.trim();
            if (!content || addNote.isPending) return;
            addNote.mutate(content);
          }}
        >
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Add a note…"
            rows={2}
            className={`w-full ${inputClasses}`}
          />
          <button
            type="submit"
            disabled={!noteDraft.trim() || addNote.isPending}
            className={`self-end ${primaryButtonClasses}`}
          >
            {addNote.isPending ? "Adding…" : "Add note"}
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-lg border border-hairline p-4">
        <h3 className="text-sm font-medium text-text-secondary">Recommended limit</h3>
        {recommendation.isLoading ? (
          <p className="mt-2 text-sm text-text-secondary">Calculating…</p>
        ) : recommendation.data ? (
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-text-primary">{recommendation.data.reasoning}</p>
              <p className="mt-1 text-xs text-text-secondary">
                Trailing average: {formatCurrency(recommendation.data.trailingAverageUsd)}/mo
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1 text-sm ${
                  recommendation.data.trendPercent > 0
                    ? "text-red-500"
                    : recommendation.data.trendPercent < 0
                      ? "text-emerald-500"
                      : "text-text-secondary"
                }`}
              >
                {recommendation.data.trendPercent > 0 ? (
                  <TrendingUp size={16} />
                ) : recommendation.data.trendPercent < 0 ? (
                  <TrendingDown size={16} />
                ) : null}
                {recommendation.data.trendPercent > 0 ? "+" : ""}
                {recommendation.data.trendPercent.toFixed(1)}%
              </div>
              <div className="text-2xl font-semibold text-text-primary">
                {formatCurrency(recommendation.data.recommendedMonthlyUsd)}
                <span className="text-sm font-normal text-text-secondary">/mo</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-text-muted">No recommendation available yet.</p>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-text-secondary">Session history</h3>
        <div className="mt-3 max-h-96 overflow-y-auto">
          <SessionHistory rows={sessions} />
        </div>
      </div>
    </div>
  );
}
