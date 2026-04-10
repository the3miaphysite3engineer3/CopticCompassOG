const ADMIN_LIST_VISIBLE_LIMIT = 5;

/**
 * Splits a list into the visible admin preview slice and its overflow items.
 */
export function splitAdminVisibleItems<T>(
  items: readonly T[],
  limit = ADMIN_LIST_VISIBLE_LIMIT,
) {
  return {
    overflow: items.slice(limit),
    visible: items.slice(0, limit),
  };
}
