export type Severity = "Critical" | "High" | "Medium" | "Low" | "Info";

export interface Vulnerability {
  line: number;
  column?: number;
  severity: Severity;
  title: string;
  description: string;
  suggestion: string;
  scenario?: string; // Exploit scenario description
  affectedCode?: string; // The actual code snippet causing the issue
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
}
