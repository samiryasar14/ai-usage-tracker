import { getDb, type SavedView } from "@ai-usage-tracker/db";

export async function listSavedViews(viewType?: string): Promise<SavedView[]> {
  const db = getDb();
  return db.savedView.findMany({
    where: viewType ? { viewType } : {},
    orderBy: { createdAt: "asc" },
  });
}

export async function createSavedView(
  name: string,
  viewType: string,
  filterConfig: string,
): Promise<SavedView> {
  const db = getDb();
  return db.savedView.create({
    data: { name, viewType, filterConfig },
  });
}

export async function deleteSavedView(id: string): Promise<void> {
  const db = getDb();
  await db.savedView.delete({ where: { id } });
}
