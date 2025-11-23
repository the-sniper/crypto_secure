export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
export type Grade = "A" | "B" | "C" | "D" | "F";
export type FindingStatus = "Open" | "Fixed" | "Mitigated" | "Accepted";
export type RecommendationPriority = "High" | "Medium" | "Low";

export interface FindingLocation {
  function?: string;
  lineStart: number;
  lineEnd: number;
  snippet?: string;
}

export interface CodeChanges {
  vulnerableCode: string;
  fixedCode: string;
  startLine: number;
  endLine: number;
  changeDescription: string;
}

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  category: string;
  status: FindingStatus;
  description: string;
  location: FindingLocation;
  impact: string;
  exploitScenario?: string;
  recommendation: string;
  secureCodeExample?: string;
  codeChanges?: CodeChanges;
  references?: string[];
  cwe?: string;
  estimatedRiskScore?: number;
}

export interface AnalysisMetadata {
  contractName: string;
  language: string;
  linesOfCode: number;
  analysisDate: string;
  analysisDuration?: string;
  totalIssuesFound: number;
}

export interface FindingsSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  informational: number;
}

export interface Recommendation {
  priority: RecommendationPriority;
  title: string;
  description: string;
  rationale: string;
}

export interface GasOptimization {
  location: string;
  currentApproach: string;
  optimizedApproach: string;
  estimatedSavings: string;
}

export interface AnalysisResult {
  analysisMetadata: AnalysisMetadata;
  securityScore: number;
  grade: Grade;
  executiveSummary: string;
  findingsSummary: FindingsSummary;
  findings: Finding[];
  recommendations: Recommendation[];
  gasOptimizations: GasOptimization[];
  codeQualityObservations?: string[];
  positiveFindings?: string[];
  nextSteps?: string;
}

// Legacy types for backward compatibility (if needed during migration)
export type LegacySeverity = "Critical" | "High" | "Medium" | "Low" | "Info";

export interface LegacyVulnerability {
  line: number;
  column?: number;
  severity: LegacySeverity;
  title: string;
  description: string;
  suggestion: string;
  scenario?: string; 
  affectedCode?: string; 
  fileName?: string; 
  function?: string; 
}
