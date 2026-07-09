import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { DEFAULT_FILTER_CONFIG, FilterBar, type FilterConfig } from "../components/FilterBar";
import { ProjectsTable } from "../components/ProjectsTable";
import { ProjectDetail } from "../components/ProjectDetail";

export function ProjectsView() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [filterConfig, setFilterConfig] = useState<FilterConfig>(DEFAULT_FILTER_CONFIG);

  const queryClient = useQueryClient();

  const projects = useQuery({ queryKey: ["projects"], queryFn: api.projects });
  const sessions = useQuery({ queryKey: ["sessions", 200], queryFn: () => api.sessions(200) });
  const tags = useQuery({ queryKey: ["tags"], queryFn: api.tags });
  const savedViews = useQuery({
    queryKey: ["savedViews", "projects"],
    queryFn: () => api.savedViews("projects"),
  });

  const saveView = useMutation({
    mutationFn: (name: string) => api.createSavedView(name, "projects", JSON.stringify(filterConfig)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["savedViews", "projects"] }),
  });

  const deleteView = useMutation({
    mutationFn: (id: string) => api.deleteSavedView(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["savedViews", "projects"] }),
  });

  const allProjects = projects.data ?? [];

  const filteredProjects = useMemo(() => {
    const search = filterConfig.search.trim().toLowerCase();
    return allProjects.filter((row) => {
      if (search && !row.name.toLowerCase().includes(search)) return false;
      if (filterConfig.minCost !== null && row.cost < filterConfig.minCost) return false;
      if (filterConfig.tagId && !row.tags.some((tag) => tag.id === filterConfig.tagId)) return false;
      return true;
    });
  }, [allProjects, filterConfig]);

  const selectedProject = allProjects.find((row) => row.projectId === selectedProjectId) ?? null;
  const projectSessions = selectedProject
    ? (sessions.data ?? []).filter((row) => row.projectPath === selectedProject.path)
    : [];

  return (
    <div>
      <section className="rounded-lg border border-hairline bg-surface p-5">
        <h2 className="text-sm font-medium text-text-secondary">Projects</h2>
        <div className="mt-3">
          <FilterBar
            filterConfig={filterConfig}
            onChange={setFilterConfig}
            tags={tags.data ?? []}
            savedViews={savedViews.data ?? []}
            onLoadView={setFilterConfig}
            onSaveView={(name) => saveView.mutate(name)}
            onDeleteView={(id) => deleteView.mutate(id)}
          />
        </div>
        <div className="mt-3 text-xs text-text-muted">
          {filteredProjects.length} of {allProjects.length} projects
        </div>
        <div className="mt-3">
          <ProjectsTable
            rows={filteredProjects}
            onSelect={setSelectedProjectId}
            selectedProjectId={selectedProjectId}
          />
        </div>
      </section>

      {selectedProject && (
        <ProjectDetail
          project={selectedProject}
          sessions={projectSessions}
          onClose={() => setSelectedProjectId(null)}
        />
      )}
    </div>
  );
}
