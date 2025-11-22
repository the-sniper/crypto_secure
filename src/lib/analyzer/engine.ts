import { AnalysisResult, Vulnerability } from "@/types/analysis";
import { RULES } from "./rules";
import { normalizeCode, stripComments } from "./utils";

export function analyzeCodeStatic(rawCode: string): AnalysisResult {
  const cleanCode = normalizeCode(rawCode);
  const codeLines = rawCode.split("\n"); // Keep original lines for reporting line numbers (approximate)
  const vulnerabilities: Vulnerability[] = [];

  // Simple heuristics score
  let score = 100;

  // 1. Check specific Rules
  for (const rule of RULES) {
    const matches = rule.pattern.test(cleanCode);
    
    // Logic: 
    // If invert is true, we look for presence. If NOT found -> Vulnerability.
    // If invert is false (default), we look for presence. If FOUND -> Vulnerability.
    const isVulnerable = rule.invert ? !matches : matches;

    if (isVulnerable) {
      // Deduct score
      switch (rule.severity) {
        case "Critical": score -= 25; break;
        case "High": score -= 15; break;
        case "Medium": score -= 10; break;
        case "Low": score -= 5; break;
        case "Info": score -= 0; break;
      }

      // Attempt to find line number (Naive approach: find first occurrence of pattern)
      let lineNo = 1;
      if (!rule.invert) {
        // If we found a bad pattern, try to locate it in original code
        // This is hard with regex but we can try simple substring match if pattern is simple
        // For complex regex, we just default to line 1 or top
        for (let i = 0; i < codeLines.length; i++) {
            // Clean the line to match against comments
            const lineClean = stripComments(codeLines[i]);
            if (rule.pattern.test(lineClean)) {
                lineNo = i + 1;
                break;
            }
        }
      }

      vulnerabilities.push({
        line: lineNo,
        severity: rule.severity,
        title: rule.title,
        description: rule.description,
        suggestion: rule.suggestion
      });
    }
  }
  
  // TipJar specific logic override (Hybrid Rule)
  // If we see "total_balance -=" but NO "equal_slices" in the entire file, that's a critical TipJar bug
  const hasWithdraw = /total_balance\s*-=/.test(cleanCode);
  const hasAuth = /equal_slices/.test(cleanCode);
  
  // Remove generic rules if we can be more specific
  if (hasWithdraw && !hasAuth) {
     // Ensure we have the critical alert
     const exists = vulnerabilities.find(v => v.title === "Potential Unprotected Withdrawal");
     if (!exists) {
         vulnerabilities.push({
             line: 0,
             severity: "Critical",
             title: "Potential Unprotected Withdrawal",
             description: "Funds are subtracted from total_balance, but no owner authentication (equal_slices) was detected.",
             suggestion: "Add access control checks immediately."
         });
         score -= 30;
     }
  } else if (hasWithdraw && hasAuth) {
      // If we have both, we might be safe from the naive check. 
      // Remove false positives from the generic "TIPJAR_VULNERABILITY" rule if it was triggered just by presence
      const index = vulnerabilities.findIndex(v => v.title === "Potential Unprotected Withdrawal");
      if (index !== -1) {
          vulnerabilities.splice(index, 1);
          score += 25; // Refund points
      }
  }

  return {
    vulnerabilities,
    summary: `Static analysis completed. Found ${vulnerabilities.length} potential issues. Score calculated deterministically.`,
    score: Math.max(0, Math.round(score))
  };
}

