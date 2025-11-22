"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  Bug, 
  ShieldAlert, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  AlertOctagon 
} from "lucide-react";
import { AnalysisResult, Vulnerability } from "@/types/analysis";

// Internal Component for Severity Section (Accordion)
const SeveritySection = ({ 
  severity, 
  count, 
  vulnerabilities, 
  icon: Icon,
  colorClass,
  bgClass,
  borderClass
}: { 
  severity: string, 
  count: number, 
  vulnerabilities: Vulnerability[],
  icon: any,
  colorClass: string,
  bgClass: string,
  borderClass: string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Don't render empty sections
  if (count === 0) return null;

  return (
    <div className="border rounded-lg overflow-hidden mb-4">
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className={`w-full flex items-center justify-between p-4 ${bgClass} hover:brightness-95 transition-all`}
       >
          <div className="flex items-center gap-3">
            <Icon className={`h-5 w-5 ${colorClass}`} />
            <span className="font-semibold text-lg">{severity} Severity</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold bg-black/5 dark:bg-white/10 border border-black/5`}>
              {count}
            </span>
            {isOpen ? <ChevronUp className="h-4 w-4 opacity-50"/> : <ChevronDown className="h-4 w-4 opacity-50"/>}
          </div>
       </button>
       
       {isOpen && (
         <div className="p-4 space-y-4 bg-neutral-50/50 dark:bg-neutral-900/50 border-t">
            {vulnerabilities.map((vuln, idx) => (
              <div key={idx} className={`bg-white dark:bg-neutral-900 p-4 rounded-lg border-l-4 shadow-sm ${borderClass}`}>
                 <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-base">{vuln.title}</h4>
                    <div className="text-right">
                        <span className="text-xs font-mono opacity-60 block bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                            {vuln.fileName || "contract.fc"}:{vuln.line}
                        </span>
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                     <div>
                         <h5 className={`text-xs font-bold uppercase mb-1 ${colorClass} opacity-80`}>Impact</h5>
                         <p className="text-sm opacity-90">{vuln.description}</p>
                     </div>

                     {vuln.scenario && (
                         <div className="border-l-2 border-blue-400 pl-3 py-1 my-2">
                             <h5 className="text-xs font-bold uppercase mb-1 text-blue-600">Scenario</h5>
                             <p className="text-sm opacity-90 text-neutral-600 dark:text-neutral-400">{vuln.scenario}</p>
                         </div>
                     )}
                     
                     {vuln.affectedCode && (
                        <div>
                            <h5 className="text-xs font-bold uppercase mb-1 text-red-600 opacity-80">Affected Code</h5>
                            <div className="bg-neutral-100 dark:bg-neutral-950 p-3 rounded border border-red-100 dark:border-red-900/30">
                                {vuln.function && (
                                    <div className="text-xs font-mono text-neutral-500 mb-1">function {vuln.function}() &#123;</div>
                                )}
                                <code className="text-sm font-mono block whitespace-pre-wrap text-red-700 dark:text-red-400">
                                    {vuln.affectedCode}
                                </code>
                                {vuln.function && (
                                    <div className="text-xs font-mono text-neutral-500 mt-1">&#125;</div>
                                )}
                            </div>
                        </div>
                     )}

                     <div className="bg-neutral-50 dark:bg-neutral-950 p-3 rounded border border-black/5 mt-2">
                        <h5 className="text-xs font-bold uppercase mb-1 text-green-600">Proposed Fix</h5>
                        <code className="text-sm font-mono block whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
                          {vuln.suggestion}
                        </code>
                     </div>
                 </div>
              </div>
            ))}
         </div>
       )}
    </div>
  )
}

export function CodeAnalyzer() {
  const [code, setCode] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!code.trim()) return;
    
    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Analysis failed");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle>Smart Contract Auditor</CardTitle>
          <CardDescription>
            Paste your FunC or Tact code below for an instant security check.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Textarea
            placeholder="// Paste your smart contract code here..."
            className="min-h-[300px] font-mono text-sm"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          
          <div className="flex justify-end">
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !code.trim()}
              size="lg"
              className="w-full sm:w-auto"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Logic...
                </>
              ) : (
                "Scan for Bugs"
              )}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
              <ShieldAlert className="h-5 w-5" />
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-4">
              
              {/* 1. Executive Summary & Score */}
              <div className="grid gap-6 md:grid-cols-[1fr_200px]">
                <div className="p-5 rounded-xl border bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950 shadow-sm">
                  <h3 className="font-bold text-lg mb-2">Scan Results</h3>
                  <p className="text-neutral-600 dark:text-neutral-400">{result.summary}</p>
                </div>
                <div className={`p-5 rounded-xl border flex flex-col items-center justify-center ${
                  result.score > 80 ? "bg-green-50 border-green-200 text-green-700" :
                  result.score > 50 ? "bg-yellow-50 border-yellow-200 text-yellow-700" :
                  "bg-red-50 border-red-200 text-red-700"
                }`}>
                  <div className="text-5xl font-black tracking-tighter">{result.score}</div>
                  <div className="text-xs font-bold uppercase tracking-widest opacity-70 mt-1">Security Score</div>
                </div>
              </div>

              {/* 2. Stats Grid (Top Overview) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-red-50/50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-red-600 dark:text-red-400 font-bold text-3xl">{result.stats.critical}</span>
                  <span className="text-xs text-red-600/80 dark:text-red-400/80 uppercase font-bold tracking-wider mt-1">Critical</span>
                </div>
                <div className="p-4 bg-orange-50/50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/50 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-orange-600 dark:text-orange-400 font-bold text-3xl">{result.stats.high}</span>
                  <span className="text-xs text-orange-600/80 dark:text-orange-400/80 uppercase font-bold tracking-wider mt-1">High</span>
                </div>
                <div className="p-4 bg-yellow-50/50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/50 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-yellow-600 dark:text-yellow-400 font-bold text-3xl">{result.stats.medium}</span>
                  <span className="text-xs text-yellow-600/80 dark:text-yellow-400/80 uppercase font-bold tracking-wider mt-1">Medium</span>
                </div>
                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-lg flex flex-col items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-3xl">{result.stats.low}</span>
                  <span className="text-xs text-blue-600/80 dark:text-blue-400/80 uppercase font-bold tracking-wider mt-1">Low</span>
                </div>
              </div>

              {/* 3. Detailed Findings (Accordions) */}
              <div>
                 <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                   <Bug className="h-5 w-5" />
                   Vulnerability Report
                 </h3>

                 {result.vulnerabilities.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed border-green-200 rounded-xl bg-green-50/50">
                        <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
                        <h4 className="font-bold text-green-800 text-lg">All Clear!</h4>
                        <p className="text-green-700">No known vulnerabilities detected in your code.</p>
                    </div>
                 ) : (
                   <>
                     <SeveritySection 
                       severity="Critical" 
                       count={result.stats.critical} 
                       vulnerabilities={result.vulnerabilities.filter(v => v.severity === "Critical")}
                       icon={AlertOctagon}
                       colorClass="text-red-600"
                       bgClass="bg-red-50/50 dark:bg-red-900/20"
                       borderClass="border-l-red-500"
                     />
                     <SeveritySection 
                       severity="High" 
                       count={result.stats.high} 
                       vulnerabilities={result.vulnerabilities.filter(v => v.severity === "High")}
                       icon={ShieldAlert}
                       colorClass="text-orange-600"
                       bgClass="bg-orange-50/50 dark:bg-orange-900/20"
                       borderClass="border-l-orange-500"
                     />
                     <SeveritySection 
                       severity="Medium" 
                       count={result.stats.medium} 
                       vulnerabilities={result.vulnerabilities.filter(v => v.severity === "Medium")}
                       icon={AlertTriangle}
                       colorClass="text-yellow-600"
                       bgClass="bg-yellow-50/50 dark:bg-yellow-900/20"
                       borderClass="border-l-yellow-500"
                     />
                     <SeveritySection 
                       severity="Low" 
                       count={result.stats.low} 
                       vulnerabilities={result.vulnerabilities.filter(v => v.severity === "Low")}
                       icon={Info}
                       colorClass="text-blue-600"
                       bgClass="bg-blue-50/50 dark:bg-blue-900/20"
                       borderClass="border-l-blue-500"
                     />
                   </>
                 )}
              </div>

            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
