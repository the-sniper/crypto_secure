export type Severity = "Critical" | "High" | "Medium" | "Low" | "Info";

export interface Vulnerability {
  line: number;
  severity: Severity;
  title: string;
  description: string;
  suggestion: string;
}

export interface AnalysisResult {
  vulnerabilities: Vulnerability[];
  summary: string;
  score: number;
}

