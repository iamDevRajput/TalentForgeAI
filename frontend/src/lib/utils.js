/**
 * utils.js — shadcn/ui utility function
 *
 * cn() merges Tailwind classes intelligently:
 *   - clsx handles conditional classes
 *   - tailwind-merge deduplicates conflicting Tailwind utilities
 *     (e.g. "p-2 p-4" → "p-4")
 *
 * Every shadcn component uses this. Custom components should too.
 */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
