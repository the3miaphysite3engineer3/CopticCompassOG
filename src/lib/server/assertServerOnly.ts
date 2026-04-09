/**
 * Throws when a server-only module is imported in a browser runtime so Node.js
 * dependencies fail fast during development.
 */
export function assertServerOnly(moduleName: string) {
  if (typeof window !== "undefined") {
    throw new Error(
      `${moduleName} is server-only and depends on the Node.js runtime.`,
    );
  }
}
