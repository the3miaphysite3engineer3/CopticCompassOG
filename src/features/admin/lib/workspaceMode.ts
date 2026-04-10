export const ADMIN_WORKSPACE_MODES = [
  "review",
  "communications",
  "system",
] as const;

export type AdminWorkspaceMode = (typeof ADMIN_WORKSPACE_MODES)[number];

/**
 * Resolves an arbitrary workspace-mode value to one of the supported admin
 * dashboard modes.
 */
export function resolveAdminWorkspaceMode(
  value: string | null | undefined,
): AdminWorkspaceMode {
  return value && ADMIN_WORKSPACE_MODES.includes(value as AdminWorkspaceMode)
    ? (value as AdminWorkspaceMode)
    : "review";
}
