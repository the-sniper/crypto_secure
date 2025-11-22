export function stripComments(code: string): string {
  // Remove single-line comments (// ...) or (;; ...) for FunC
  let clean = code.replace(/\/\/.*$/gm, "").replace(/;;.*$/gm, "");
  
  // Remove multi-line comments (/* ... */) or ({- ... -}) for FunC
  clean = clean.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\{-[\s\S]*?-\}/g, "");
  
  return clean;
}

export function normalizeCode(code: string): string {
  const noComments = stripComments(code);
  // Collapse whitespace to single spaces for easier regex matching
  return noComments.replace(/\s+/g, " ").trim();
}

