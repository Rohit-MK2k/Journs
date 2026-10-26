/**
 * Utility functions for determining whether journal text should be summarized.
 */

export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function isProgrammingCode(text: string): boolean {
  if (!text) return false;
  // Markdown code fences
  if (/```[\s\S]*?```/.test(text)) return true;

  // Common programming language declarations / syntax
  const codePatterns = [
    /^\s*(import|export)\s+.+from\s+['"].+['"]/m,
    /^\s*(const|let|var)\s+\w+\s*=/m,
    /^\s*function\s+\w+\s*\(.*\)\s*\{/m,
    /^\s*class\s+\w+\s*\{/m,
    /^\s*public\s+class\s+\w+/m,
    /^\s*def\s+\w+\(.*\):/m,
    /^\s*#include\s+<.*>/m,
    /^\s*<\?php/m,
    /^\s*package\s+\w+/m,
  ];

  return codePatterns.some((pattern) => pattern.test(text));
}

/**
 * Returns true if text has more than 20 words and is not programming code.
 */
export function shouldSummarize(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  if (countWords(text) <= 20) return false;
  if (isProgrammingCode(text)) return false;
  return true;
}
