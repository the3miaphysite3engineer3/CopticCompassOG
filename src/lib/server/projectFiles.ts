import fs from "fs";
import path from "path";

import { assertServerOnly } from "./assertServerOnly.ts";

assertServerOnly("src/lib/server/projectFiles.ts");

/**
 * Normalizes a project-relative file path so downstream path joins cannot be
 * accidentally treated as absolute paths.
 */
function normalizeProjectPath(relativePath: string) {
  return relativePath.replace(/^\/+/, "");
}

/**
 * Resolves a project-relative file path against the current workspace root.
 */
function getProjectFilePath(relativePath: string) {
  return path.join(process.cwd(), normalizeProjectPath(relativePath));
}

/**
 * Reads and parses a JSON file from the project tree, returning `null` when
 * the file is absent instead of throwing for missing content.
 */
export function readProjectJsonFile<T>(relativePath: string): T | null {
  const filePath = getProjectFilePath(relativePath);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

/**
 * Returns the most recent modification time across a set of project-relative
 * source files, ignoring any paths that do not currently exist.
 */
export function getLatestProjectFileMtime(relativePaths: readonly string[]) {
  const modifiedTimestamps = relativePaths
    .map(getProjectFilePath)
    .filter((absolutePath) => fs.existsSync(absolutePath))
    .map((absolutePath) => fs.statSync(absolutePath).mtime.getTime());

  if (modifiedTimestamps.length === 0) {
    return undefined;
  }

  return new Date(Math.max(...modifiedTimestamps));
}
