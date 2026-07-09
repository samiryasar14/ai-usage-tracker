import { getDb } from "@ai-usage-tracker/db";
import type { ProjectNote } from "@ai-usage-tracker/db";

export async function listProjectNotes(projectId: string): Promise<ProjectNote[]> {
  const db = getDb();
  return db.projectNote.findMany({ where: { projectId }, orderBy: { createdAt: "desc" } });
}

export async function addProjectNote(projectId: string, content: string): Promise<ProjectNote> {
  const db = getDb();
  return db.projectNote.create({ data: { projectId, content } });
}

export async function deleteNote(id: string): Promise<void> {
  const db = getDb();
  await db.projectNote.delete({ where: { id } });
}
