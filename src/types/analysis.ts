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
