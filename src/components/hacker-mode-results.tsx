"use client";

import { HackerModeResult, ExploitAttempt, AttackSurface } from "@/types/analysis";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertTriangle, 
  CheckCircle, 
  Shield, 
  Bug,
  AlertOctagon,
  Info,
  ChevronDown,
  ChevronUp,
  Code,
  Target,
  Zap
} from "lucide-react";
import { useState } from "react";

interface HackerModeResultsProps {
  result: HackerModeResult;
}

export function HackerModeResults({ result }: HackerModeResultsProps) {
  const [expandedExploits, setExpandedExploits] = useState<Set<string>>(new Set());
  const [expandedSurfaces, setExpandedSurfaces] = useState<Set<string>>(new Set());

  const toggleExploit = (id: string) => {
    const newSet = new Set(expandedExploits);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedExploits(newSet);
  };

  const toggleSurface = (id: string) => {
    const newSet = new Set(expandedSurfaces);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedSurfaces(newSet);
  };

  const plausibleExploits = result.exploits.filter(e => e.status === "plausible");
  const theoreticalExploits = result.exploits.filter(e => e.status === "theoretical");
  const notApplicableExploits = result.exploits.filter(e => e.status === "not-applicable");

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-700 bg-green-50 border-green-200";
    if (score >= 50) return "text-yellow-700 bg-yellow-50 border-yellow-200";
    if (score >= 30) return "text-orange-700 bg-orange-50 border-orange-200";
    return "text-red-700 bg-red-50 border-red-200";
  };

  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case "Critical": return "bg-red-100 text-red-800 border-red-300";
      case "High": return "bg-orange-100 text-orange-800 border-orange-300";
      case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Low": return "bg-blue-100 text-blue-800 border-blue-300";
      default: return "bg-green-100 text-green-800 border-green-300";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "bg-red-100 text-red-800";
      case "High": return "bg-orange-100 text-orange-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Low": return "bg-blue-100 text-blue-800";
      default: return "bg-neutral-100 text-neutral-800";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "plausible":
        return <span className="px-2 py-1 text-xs font-bold rounded bg-red-100 text-red-800 border border-red-300">PLAUSIBLE</span>;
      case "theoretical":
        return <span className="px-2 py-1 text-xs font-bold rounded bg-yellow-100 text-yellow-800 border border-yellow-300">THEORETICAL</span>;
      case "not-applicable":
        return <span className="px-2 py-1 text-xs font-bold rounded bg-neutral-100 text-neutral-600 border border-neutral-300">NOT APPLICABLE</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
      {/* Hacker Resilience Score */}
      <div className="grid gap-6 md:grid-cols-[1fr_200px]">
        <div className="p-5 rounded-xl border bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 shadow-sm">
          <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Hacker Mode Analysis
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400">{result.summary}</p>
        </div>
        <div className={`p-5 rounded-xl border flex flex-col items-center justify-center ${getScoreColor(result.hackerResilienceScore)}`}>
          <div className="text-5xl font-black tracking-tighter">{result.hackerResilienceScore}</div>
          <div className="text-xs font-bold uppercase tracking-widest opacity-70 mt-1">Resilience Score</div>
          <div className={`mt-3 px-3 py-1 rounded-full text-xs font-bold border ${getRiskLevelColor(result.riskLevel)}`}>
            {result.riskLevel} Risk
          </div>
        </div>
      </div>

      {/* Attack Surface Map */}
      {result.attackSurface.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Attack Surface Map
            </CardTitle>
            <CardDescription>
              Entry points and risk factors identified in the contract
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.attackSurface.map((surface) => {
              const isExpanded = expandedSurfaces.has(surface.id);
              return (
                <div
                  key={surface.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleSurface(surface.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded">
                        <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {surface.entryPoint}
                          {surface.lineNumber && (
                            <span className="ml-2 text-xs text-neutral-500">(Line {surface.lineNumber})</span>
                          )}
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                          {surface.riskFactors.length} risk factor{surface.riskFactors.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-neutral-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-neutral-400" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 border-t">
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Risk Factors:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                            {surface.riskFactors.map((factor, idx) => (
                              <li key={idx}>{factor}</li>
                            ))}
                          </ul>
                        </div>
                        {surface.notes && (
                          <div>
                            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Notes:</p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">{surface.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Exploit Attempts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Exploit Attempts
          </CardTitle>
          <CardDescription>
            {result.exploits.length > 0 
              ? `${plausibleExploits.length} plausible, ${theoreticalExploits.length} theoretical, ${notApplicableExploits.length} not applicable`
              : "No exploit attempts generated"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.exploits.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50">
              <Bug className="h-10 w-10 text-neutral-400 mx-auto mb-3" />
              <h4 className="font-bold text-neutral-600 text-lg">No Exploits Found</h4>
              <p className="text-neutral-500">The AI agent did not identify any exploit attempts for this contract.</p>
            </div>
          ) : (
            <>
            {/* Plausible Exploits First */}
            {plausibleExploits.map((exploit) => {
              const isExpanded = expandedExploits.has(exploit.id);
              const recommendation = result.recommendations.find(r => r.exploitId === exploit.id);
              
              return (
                <div
                  key={exploit.id}
                  className="border-2 border-red-200 dark:border-red-900 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleExploit(exploit.id)}
                    className="w-full p-4 flex items-start justify-between hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1 text-left">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded mt-0.5">
                        <AlertOctagon className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">{exploit.title}</span>
                          {getStatusBadge(exploit.status)}
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getSeverityColor(exploit.severity)}`}>
                            {exploit.severity}
                          </span>
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                          Type: {exploit.type} • Likelihood: {exploit.likelihood}
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-neutral-400 mt-1" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-neutral-400 mt-1" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="p-4 bg-red-50/30 dark:bg-red-900/10 border-t border-red-200 dark:border-red-900 space-y-4">
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">Prerequisites:</p>
                        <p className="text-sm text-neutral-700 dark:text-neutral-300">{exploit.prerequisites || "None specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">Expected Impact:</p>
                        <p className="text-sm text-neutral-700 dark:text-neutral-300">{exploit.expectedImpact || "Not specified"}</p>
                      </div>
                      {exploit.exploitCode && (
                        <div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2 flex items-center gap-2">
                            <Code className="h-4 w-4" />
                            Exploit Code
                            <span className="ml-auto text-xs text-red-600 dark:text-red-400 font-bold">
                              EDUCATIONAL/DEMONSTRATION ONLY
                            </span>
                          </p>
                          <pre className="p-3 bg-neutral-900 dark:bg-neutral-950 text-green-400 text-xs rounded overflow-x-auto border border-neutral-700">
                            <code>{exploit.exploitCode}</code>
                          </pre>
                        </div>
                      )}
                      {exploit.tonSpecificNotes && (
                        <div>
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">TON-Specific Notes:</p>
                          <p className="text-sm text-neutral-700 dark:text-neutral-300">{exploit.tonSpecificNotes}</p>
                        </div>
                      )}
                      {recommendation && (
                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg">
                          <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Defense Recommendation
                          </p>
                          <p className="text-sm text-green-800 dark:text-green-200 mb-2">{recommendation.mitigation}</p>
                          {recommendation.codeExample && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-green-900 dark:text-green-100 mb-1">Code Example:</p>
                              <pre className="p-2 bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 text-xs rounded overflow-x-auto">
                                <code>{recommendation.codeExample}</code>
                              </pre>
                            </div>
                          )}
                          {recommendation.tonSpecific && (
                            <p className="text-xs text-green-700 dark:text-green-300 mt-2">✓ TON-specific mitigation</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Theoretical Exploits */}
            {theoreticalExploits.map((exploit) => {
              const isExpanded = expandedExploits.has(exploit.id);
              
              return (
                <div
                  key={exploit.id}
                  className="border border-yellow-200 dark:border-yellow-900 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleExploit(exploit.id)}
                    className="w-full p-4 flex items-start justify-between hover:bg-yellow-50/50 dark:hover:bg-yellow-900/20 transition-colors"
                  >
                    <div className="flex items-start gap-3 flex-1 text-left">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded mt-0.5">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100">{exploit.title}</span>
                          {getStatusBadge(exploit.status)}
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                          Type: {exploit.type} • Likelihood: {exploit.likelihood}
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-neutral-400 mt-1" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-neutral-400 mt-1" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="p-4 bg-yellow-50/30 dark:bg-yellow-900/10 border-t border-yellow-200 dark:border-yellow-900 space-y-3">
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">Prerequisites:</p>
                        <p className="text-sm text-neutral-700 dark:text-neutral-300">{exploit.prerequisites || "None specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">Expected Impact:</p>
                        <p className="text-sm text-neutral-700 dark:text-neutral-300">{exploit.expectedImpact || "Not specified"}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

