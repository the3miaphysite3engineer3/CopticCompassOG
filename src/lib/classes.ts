/**
 * Joins optional class-name fragments while discarding falsey values.
 */
export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
