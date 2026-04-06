export const ADMIN_LIST_VISIBLE_LIMIT = 5;

export function splitAdminVisibleItems<T>(
  items: readonly T[],
  limit = ADMIN_LIST_VISIBLE_LIMIT,
) {
  return {
    overflow: items.slice(limit),
    visible: items.slice(0, limit),
  };
}
