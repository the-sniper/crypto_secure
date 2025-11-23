export const SYSTEM_PROMPT = `You are an expert TON blockchain smart contract security auditor with deep knowledge of FunC and Tact programming languages. Your role is to analyze smart contracts for security vulnerabilities and provide comprehensive, actionable reports.

EXPERTISE AREAS:

- TON Virtual Machine (TVM) architecture and asynchronous message handling
- FunC and Tact language-specific vulnerabilities
- Common smart contract attack vectors (reentrancy, integer overflow, access control, etc.)
- TON-specific issues: bounced messages, gas optimization, cell structure problems
- DeFi protocol security patterns
- Best practices from TONScanner research and Trail of Bits recommendations

ANALYSIS METHODOLOGY:

1. Parse the contract structure and identify key functions
2. Check for the 8 primary TON vulnerability types
3. Analyze access control and permission mechanisms
4. Review state management and data consistency
5. Examine external call patterns and message handling
6. Assess gas efficiency and potential DoS vectors
7. Verify proper error handling and edge cases

VULNERABILITY CATEGORIES TO CHECK:

1. Reentrancy vulnerabilities
2. Access control issues (missing permission checks)
3. Integer overflow/underflow
4. Unchecked return values
5. Bad randomness
6. Precision loss in calculations
7. Unchecked bounced messages (TON-specific)
8. Improper function modifiers (missing 'impure')
9. Global variable redefinition
10. Incomplete data parsing
11. Inconsistent state management
12. Gas optimization issues
13. DoS vulnerabilities
14. Front-running susceptibility
15. Oracle manipulation risks

OUTPUT FORMAT:

Always respond with valid JSON matching this exact structure (no additional text before or after):

{
  "analysisMetadata": {...},
  "securityScore": 0-100,
  "grade": "A/B/C/D/F",
  "executiveSummary": "...",
  "findings": [...],
  "recommendations": [...],
  "gasOptimizations": [...]
}

SEVERITY LEVELS:

- CRITICAL: Direct loss of funds, complete contract compromise
- HIGH: Significant security risk, potential fund loss under certain conditions
- MEDIUM: Security concern that should be addressed, limited impact
- LOW: Best practice violations, minor improvements
- INFORMATIONAL: Code quality, gas optimization, documentation

Be thorough, precise, and educational in your explanations.`;

export function detectLanguage(code: string): string {
  if (code.includes('#include') || code.includes('impure') || code.includes('slice') || code.includes('cell')) {
    return 'FunC';
  } else if (code.includes('contract') || code.includes('trait') || code.includes('message')) {
    return 'Tact';
  }
  return 'Unknown';
}

export function createAnalysisPrompt(contractCode: string, contractName: string, additionalContext: string = ''): string {
  const linesOfCode = contractCode.split('\n').length;
  const language = detectLanguage(contractCode);

  return `# SMART CONTRACT SECURITY ANALYSIS REQUEST

## Contract Information

**Contract Name:** ${contractName}
**Language:** ${language}
**Lines of Code:** ${linesOfCode}

${additionalContext ? `**Additional Context:** ${additionalContext}` : ''}

## Contract Code

\`\`\`func

${contractCode}

\`\`\`

## Analysis Instructions

Please perform a comprehensive security analysis of this TON smart contract and provide a detailed report in JSON format.

### Required Analysis Steps:

1. **CODE STRUCTURE REVIEW**
   - Identify all functions and their purposes
   - Map the contract's state variables
   - Understand the business logic and intended behavior
   - Note any external dependencies or imports

2. **VULNERABILITY SCANNING**

   Check for these specific vulnerabilities:

   **Critical Issues:**

   - Reentrancy: External calls before state updates
   - Access Control: Missing permission checks on sensitive functions
   - Integer Issues: Overflow/underflow in arithmetic operations
   - Unchecked Returns: Failed sends or external calls not handled

   **TON-Specific Issues:**

   - Bounced Messages: Unhandled bounced message scenarios
   - Improper Modifiers: Missing 'impure' keyword on state-changing functions
   - Cell Parsing: Incomplete or improper data parsing from cells
   - Gas Issues: Operations that could exceed gas limits

   **Data & State Issues:**

   - Precision Loss: Rounding errors in division operations
   - Variable Shadowing: Global variable redefinition
   - State Consistency: Race conditions or inconsistent state updates
   - Bad Randomness: Predictable random number generation

   **DeFi-Specific (if applicable):**

   - Price Oracle Manipulation
   - Flash Loan Attack Vectors
   - Front-Running Vulnerabilities
   - Liquidity Issues

3. **SECURITY SCORE CALCULATION**

   Base score: 100
   Deduct points:
   - Critical issue: -25 points each
   - High issue: -15 points each
   - Medium issue: -7 points each
   - Low issue: -3 points each
   - Informational: -1 point each

   Assign grade:
   - A: 90-100 (Excellent security)
   - B: 75-89 (Good security, minor issues)
   - C: 60-74 (Moderate security, needs improvement)
   - D: 40-59 (Poor security, significant issues)
   - F: 0-39 (Critical security flaws)

4. **REPORT GENERATION**

   For each finding, provide:
   - Unique ID (format: SEVERITY-###)
   - Clear title describing the issue
   - Severity classification with justification
   - Detailed description in plain English
   - Exact location (function name, line numbers if possible)
   - Code snippet showing the vulnerability
   - Real-world impact explanation with examples
   - Step-by-step exploitation scenario
   - Detailed remediation with secure code example
   - References to similar exploits or documentation

### Output Requirements:

Return ONLY valid JSON (no markdown, no explanations outside JSON) with this structure:

\`\`\`json
{
  "analysisMetadata": {
    "contractName": "string",
    "language": "FunC | Tact",
    "linesOfCode": number,
    "analysisDate": "ISO date string",
    "analysisDuration": "estimated time",
    "totalIssuesFound": number
  },
  
  "securityScore": number,
  
  "grade": "A | B | C | D | F",
  
  "executiveSummary": "2-3 paragraph overview",
  
  "findingsSummary": {
    "critical": number,
    "high": number,
    "medium": number,
    "low": number,
    "informational": number
  },
  
  "findings": [
    {
      "id": "CRITICAL-001",
      "title": "Brief descriptive title",
      "severity": "CRITICAL | HIGH | MEDIUM | LOW | INFORMATIONAL",
      "category": "Reentrancy | Access Control | Integer Issues | etc.",
      "status": "Open",
      "description": "Detailed explanation",
      "location": {
        "function": "function_name",
        "lineStart": number,
        "lineEnd": number,
        "snippet": "code excerpt"
      },
      "impact": "What an attacker could do",
      "exploitScenario": "Step-by-step attack",
      "recommendation": "How to fix",
      "secureCodeExample": "Fixed code",
      "codeChanges": {
        "vulnerableCode": "exact vulnerable code section with context",
        "fixedCode": "complete fixed version with improvements",
        "startLine": number,
        "endLine": number,
        "changeDescription": "summary of what was changed and why"
      },
      "references": ["urls"],
      "cwe": "CWE-XXX",
      "estimatedRiskScore": number
    }
  ],
  
  "recommendations": [
    {
      "priority": "High | Medium | Low",
      "title": "Recommendation title",
      "description": "What should be done",
      "rationale": "Why this matters"
    }
  ],
  
  "gasOptimizations": [
    {
      "location": "function or line",
      "currentApproach": "Current implementation",
      "optimizedApproach": "Better approach",
      "estimatedSavings": "Gas savings"
    }
  ],
  
  "codeQualityObservations": ["observations"],
  
  "positiveFindings": ["good practices"],
  
  "nextSteps": "Recommended actions"
}
\`\`\`

### Important Guidelines:

1. **Be Specific**: Always reference exact function names and describe precise code locations
2. **Be Educational**: Explain WHY something is a vulnerability, not just THAT it is
3. **Be Practical**: Provide actual code fixes, not just theoretical advice
4. **Be Realistic**: If an issue requires specific conditions, explain those conditions
5. **Be Thorough**: Don't miss obvious issues, but also don't create false positives
6. **Use Examples**: Reference real exploits (DAO hack, etc.) when explaining impact
7. **Consider Context**: If you need more context to make a determination, note it in recommendations

### Special Attention Areas for TON Contracts:

- **Asynchronous Message Handling**: TON uses message-passing, not direct calls. Check for race conditions.
- **Bounced Message Handling**: Verify contracts properly handle bounced messages
- **Cell Structure**: Ensure proper cell packing/unpacking and size limits
- **Gas Considerations**: TON has different gas mechanics than EVM chains
- **Admin Functions**: Pay special attention to privileged functions
- **Upgrade Mechanisms**: If upgradeable, check upgrade safety

## VULNERABILITY DETECTION EXAMPLES

### 1. REENTRANCY PATTERN

**Vulnerable:**

\`\`\`func
if (op == 2) {
  send_tokens(sender, balance[sender]); // External call FIRST
  balance[sender] = 0;                   // State update AFTER
}
\`\`\`

**Secure:**

\`\`\`func
if (op == 2) {
  var amount = balance[sender];
  balance[sender] = 0;                   // State update FIRST
  send_tokens(sender, amount);           // External call AFTER
}
\`\`\`

### 2. ACCESS CONTROL MISSING

**Vulnerable:**

\`\`\`func
() recv_external(slice in_msg) impure {
  accept_message();  // No permission check!
  int new_owner = in_msg~load_uint(256);
  owner = new_owner;
}
\`\`\`

**Secure:**

\`\`\`func
() recv_external(slice in_msg) impure {
  slice signature = in_msg~load_bits(512);
  throw_unless(401, check_signature(hash, signature, owner_pubkey));
  accept_message();
  int new_owner = in_msg~load_uint(256);
  owner = new_owner;
}
\`\`\`

### 3. UNCHECKED BOUNCED MESSAGE

**Vulnerable:**

\`\`\`func
() recv_internal(int msg_value, cell in_msg_full, slice in_msg_body) impure {
  int op = in_msg_body~load_uint(32);
  // Process operations...
}
\`\`\`

**Secure:**

\`\`\`func
() recv_internal(int msg_value, cell in_msg_full, slice in_msg_body) impure {
  int flags = in_msg_full.begin_parse()~load_uint(4);
  if (flags & 1) {
    on_bounce(in_msg_body);
    return ();
  }
  // Normal processing...
}
\`\`\`

### CODE FIX GENERATION

For EACH finding (especially CRITICAL and HIGH severity), you must provide:
1. **exactVulnerableCode**: The EXACT code snippet from the original contract that contains the vulnerability (minimum 5-10 lines for context)
2. **fixedCode**: The COMPLETE fixed version of that same code section with the vulnerability resolved
3. **lineNumbers**: Specify which lines in the original code need to be replaced

**Important Guidelines for Code Fixes:**
- Include surrounding context (at least 2-3 lines before and after)
- Maintain the same indentation and style
- Only change what's necessary to fix the vulnerability
- Ensure the fixed code is compilable and complete
- Add inline comments explaining the fix

**Example Format:**

For a finding, include:

\`\`\`json
{
  "id": "CRITICAL-001",
  "title": "Reentrancy Vulnerability",
  // ... other fields ...
  "codeChanges": {
    "vulnerableCode": "if (op == 2) { ;; withdraw\n    int amount = in_msg_body~load_coins();\n    \n    ;; VULNERABLE: External call before state update\n    send_raw_message(begin_cell()\n        .store_uint(0x18, 6)\n        .store_slice(sender)\n        .store_coins(amount)\n        .store_uint(0, 107)\n    .end_cell(), 1);\n    \n    balance -= amount; ;; State update AFTER\n}",
    "fixedCode": "if (op == 2) { ;; withdraw\n    int amount = in_msg_body~load_coins();\n    \n    ;; FIXED: Validate and update state FIRST\n    throw_unless(404, amount <= balance);\n    throw_unless(405, amount > 0);\n    balance -= amount; ;; State update FIRST\n    \n    ;; External call LAST\n    send_raw_message(begin_cell()\n        .store_uint(0x18, 6)\n        .store_slice(sender)\n        .store_coins(amount)\n        .store_uint(0, 107)\n    .end_cell(), 1);\n}",
    "startLine": 18,
    "endLine": 28,
    "changeDescription": "Reordered operations to follow checks-effects-interactions pattern. Added input validation. State updates now happen before external calls."
  }
}
\`\`\`

**Generate these code changes for ALL CRITICAL and HIGH severity findings.**

Begin analysis now.`;
}

