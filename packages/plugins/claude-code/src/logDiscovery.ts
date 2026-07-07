import { readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export function getClaudeProjectsDir(): string {
  return join(homedir(), ".claude", "projects");
}

/** Absolute paths to every session transcript (*.jsonl) under ~/.claude/projects. */
export async function listTranscriptFiles(): Promise<string[]> {
  const projectsDir = getClaudeProjectsDir();

  let projectDirs: string[];
  try {
    projectDirs = (await readdir(projectsDir, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => join(projectsDir, entry.name));
  } catch {
    return [];
  }

  const files: string[] = [];
  for (const dir of projectDirs) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".jsonl")) {
        files.push(join(dir, entry.name));
      }
    }
  }
  return files;
}
