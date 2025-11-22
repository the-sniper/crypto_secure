"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Loader2, Bug, ShieldAlert, Info } from "lucide-react";
import { AnalysisResult, Vulnerability } from "@/types/analysis";

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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "text-red-700 bg-red-50 border-red-200";
      case "High": return "text-orange-700 bg-orange-50 border-orange-200";
      case "Medium": return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "Low": return "text-blue-700 bg-blue-50 border-blue-200";
      default: return "text-neutral-700 bg-neutral-50 border-neutral-200";
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle>Smart Contract Auditor</CardTitle>
          <CardDescription>Paste your FunC or Tact code below for an instant security check.</CardDescription>
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
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
              {/* Summary Section */}
              <div className="grid gap-4 md:grid-cols-[1fr_200px]">
                <div className="p-4 rounded-lg border bg-white shadow-sm">
                  <h3 className="font-bold text-lg mb-2">Executive Summary</h3>
                  <p className="text-neutral-600">{result.summary}</p>
                </div>
                <div className={`p-4 rounded-lg border flex flex-col items-center justify-center ${
                  result.score > 80 ? "bg-green-50 border-green-200 text-green-700" :
                  result.score > 50 ? "bg-yellow-50 border-yellow-200 text-yellow-700" :
                  "bg-red-50 border-red-200 text-red-700"
                }`}>
                  <div className="text-4xl font-extrabold">{result.score}</div>
                  <div className="text-sm font-medium">Security Score</div>
                </div>
              </div>

              {/* Vulnerabilities List */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Bug className="h-5 w-5" />
                  Detailed Findings
                </h3>
                
                {result.vulnerabilities.length === 0 ? (
                  <div className="p-6 text-center border rounded-lg bg-green-50 border-green-100">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-bold text-green-800">No Issues Found</h4>
                    <p className="text-green-700">Your code passed the automated scan. Keep up the good work!</p>
                  </div>
                ) : (
                  result.vulnerabilities.map((vuln, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border ${getSeverityColor(vuln.severity)}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-white/50 uppercase border border-black/5">
                            {vuln.severity}
                          </span>
                          <h4 className="font-bold">{vuln.title}</h4>
                        </div>
                        <span className="text-sm font-mono opacity-75">Line {vuln.line}</span>
                      </div>
                      <p className="text-sm opacity-90 mb-3">{vuln.description}</p>
                      <div className="bg-white/50 p-3 rounded border border-black/5">
                        <div className="text-xs font-bold mb-1 uppercase opacity-70">How to Fix:</div>
                        <code className="text-sm font-mono block whitespace-pre-wrap">
                          {vuln.suggestion}
                        </code>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
