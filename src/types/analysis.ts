export type Severity = "Critical" | "High" | "Medium" | "Low" | "Info";

export interface Vulnerability {
  line: number;
  column?: number;
  severity: Severity;
  title: string;
  description: string;
  suggestion: string;
  scenario?: string; 
  affectedCode?: string; 
  fileName?: string; 
  function?: string; 
}

export interface AnalysisResult {
  vulnerabilities: Vulnerability[];
  summary: string;
  score: number;
  stats: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  patchedCode?: string; // The auto-fixed code
}

export interface AttackSurface {
  id: string;
  entryPoint: string; // Function name
  riskFactors: string[];
  notes: string;
  lineNumber?: number;
}

export interface ExploitAttempt {
  id: string;
  attackSurfaceId: string;
  title: string;
  type: "reentrancy" | "access-control" | "economic" | "dos" | "integer-overflow" | "other";
  prerequisites: string;
  steps: string[];
  expectedImpact: string;
  likelihood: "low" | "medium" | "high";
  status: "plausible" | "theoretical" | "not-applicable";
  exploitCode?: string;
  vulnerableLines?: number[];
  tonSpecificNotes?: string;
  severity: Severity;
}

export interface DefenseRecommendation {
  exploitId: string;
  mitigation: string;
  codeExample?: string;
  tonSpecific?: boolean;
}

export interface HackerModeResult {
  hackerResilienceScore: number; // 0-100
  attackSurface: AttackSurface[];
  exploits: ExploitAttempt[];
  summary: string;
  recommendations: DefenseRecommendation[];
  riskLevel: "Critical" | "High" | "Medium" | "Low" | "None";
}