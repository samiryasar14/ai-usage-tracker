import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { ProjectsTable } from "../components/ProjectsTable";
import { ProjectDetail } from "../components/ProjectDetail";

export function ProjectsView() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const projects = useQuery({ queryKey: ["projects"], queryFn: api.projects });
  const sessions = useQuery({ queryKey: ["sessions", 200], queryFn: () => api.sessions(200) });

  const selectedProject = projects.data?.find((row) => row.projectId === selectedProjectId) ?? null;
  const projectSessions = selectedProject
    ? (sessions.data ?? []).filter((row) => row.projectPath === selectedProject.path)
    : [];

  return (
    <div>
      <section className="rounded-lg border border-hairline bg-surface p-5">
        <h2 className="text-sm font-medium text-text-secondary">Projects</h2>
        <div className="mt-3">
          <ProjectsTable
            rows={projects.data ?? []}
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
