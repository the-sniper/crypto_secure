import { AnalysisResult, Vulnerability } from "@/types/analysis";
import { RULES } from "./rules";
import { mapFunctions } from "./utils";

export function analyzeCodeStatic(rawCode: string): AnalysisResult {
  const cleanCode = rawCode;
  const codeLines = rawCode.split("\n"); 
  const functionMap = mapFunctions(rawCode);
  const vulnerabilities: Vulnerability[] = [];

  let score = 100;

  // Helper to find function for a line
  const findFunction = (lineNo: number) => {
    return functionMap.find(f => lineNo >= f.startLine && lineNo <= f.endLine)?.name;
  };

  // Helper to extract snippet
  const getSnippet = (lineNo: number) => {
      if (lineNo <= 0 || lineNo > codeLines.length) return undefined;
      // Return the specific line + optionally context
      return codeLines[lineNo - 1].trim();
  };

  // 1. Check specific Rules
  for (const rule of RULES) {
    const matches = rule.pattern.test(cleanCode);
    
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

      let lineNo = 0; // 0 indicates "General/Global"
      let funcName: string | undefined = undefined;
      let affectedCode: string | undefined = undefined;

      if (!rule.invert) {
        // Rule found a BAD pattern. Locate it.
        for (let i = 0; i < codeLines.length; i++) {
            const lineClean = codeLines[i];
            if (rule.pattern.test(lineClean)) {
                lineNo = i + 1;
                funcName = findFunction(lineNo);
                affectedCode = getSnippet(lineNo);
                break; // Just report the first occurrence for now
            }
        }
      } else {
          // Rule missed a GOOD pattern (Inverted).
          // E.g. Missing Bounced Check
          lineNo = 1; 
          if (rule.id === "FUNC_BOUNCED_CHECK") {
             const recv = functionMap.find(f => f.name === "recv_internal");
             if (recv) {
                 lineNo = recv.startLine;
                 funcName = recv.name;
                 affectedCode = `// Missing checks in ${recv.name}`;
             }
          } else if (rule.id === "FUNC_OWNER_CHECK") {
              // If global owner check missing, maybe point to a sensitive function found
              const sensitive = functionMap.find(f => f.name.includes("withdraw") || f.name.includes("admin"));
              if (sensitive) {
                  lineNo = sensitive.startLine;
                  funcName = sensitive.name;
                  affectedCode = `// Missing auth in ${sensitive.name}`;
              }
          }
      }

      vulnerabilities.push({
        line: lineNo,
        severity: rule.severity,
        title: rule.title,
        description: rule.description,
        scenario: rule.scenario,
        suggestion: rule.suggestion,
        function: funcName,
        affectedCode: affectedCode
      });
    }
  }
  
  // TipJar specific logic override
  const hasWithdraw = /total_balance\s*-=/.test(cleanCode);
  const hasAuth = /equal_slices/.test(cleanCode);
  
  if (hasWithdraw && !hasAuth) {
     const exists = vulnerabilities.find(v => v.title === "Potential Unprotected Withdrawal");
     if (!exists) {
         // Try to find line for total_balance -=
         let lineNo = 0;
         let funcName = undefined;
         let affectedCode = undefined;
         for(let i=0; i<codeLines.length; i++) {
             if(/total_balance\s*-=/.test(codeLines[i])) {
                 lineNo = i+1;
                 funcName = findFunction(lineNo);
                 affectedCode = getSnippet(lineNo);
                 break;
             }
         }

         vulnerabilities.push({
             line: lineNo,
             severity: "Critical",
             title: "Potential Unprotected Withdrawal",
             description: "Funds are subtracted from total_balance, but no owner authentication (equal_slices) was detected.",
             scenario: "The contract subtracts from `total_balance` based on a user request (op=2). However, no `throw_unless` checks the sender's identity. Any user can simply request a withdrawal and drain the pot.",
             suggestion: "Add access control checks immediately.",
             function: funcName,
             affectedCode: affectedCode
         });
         score -= 30;
     }
  } else if (hasWithdraw && hasAuth) {
      const index = vulnerabilities.findIndex(v => v.title === "Potential Unprotected Withdrawal");
      if (index !== -1) {
          vulnerabilities.splice(index, 1);
          score += 25;
      }
  }

  // Calculate Stats
  const stats = {
      total: vulnerabilities.length,
      critical: vulnerabilities.filter(v => v.severity === "Critical").length,
      high: vulnerabilities.filter(v => v.severity === "High").length,
      medium: vulnerabilities.filter(v => v.severity === "Medium").length,
      low: vulnerabilities.filter(v => v.severity === "Low").length,
      info: vulnerabilities.filter(v => v.severity === "Info").length
  };

  return {
    vulnerabilities,
    summary: `Static analysis completed. Found ${vulnerabilities.length} potential issues.`,
    score: Math.max(0, Math.round(score)),
    stats
  };
}
