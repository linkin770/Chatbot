/**
 * Tiny class-name combiner. Avoids pulling in the full `tailwind-merge` for
 * the few cases we actually need to override utilities.
 */
export function cn(...args: Array<string | undefined | null | false>): string {
  return args.filter(Boolean).join(' ');
}
