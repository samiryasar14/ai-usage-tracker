import { getDb } from "@ai-usage-tracker/db";
import type { Tag } from "@ai-usage-tracker/db";

export async function listTags(): Promise<Tag[]> {
  const db = getDb();
  return db.tag.findMany({ orderBy: { name: "asc" } });
}

export async function createTag(name: string, color: string): Promise<Tag> {
  const db = getDb();
  return db.tag.create({ data: { name, color } });
}

export async function deleteTag(id: string): Promise<void> {
  const db = getDb();
  await db.tag.delete({ where: { id } });
}

export async function addTagToProject(projectId: string, tagId: string): Promise<void> {
  const db = getDb();
  await db.project.update({
    where: { id: projectId },
    data: { tags: { connect: { id: tagId } } },
  });
}

export async function removeTagFromProject(projectId: string, tagId: string): Promise<void> {
  const db = getDb();
  await db.project.update({
    where: { id: projectId },
    data: { tags: { disconnect: { id: tagId } } },
  });
}
