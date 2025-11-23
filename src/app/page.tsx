"use client";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, AlertTriangle, Zap, Code, Lock, Terminal, FileText, CheckCircle, ArrowRight, Wand2, FileCode, Shield, Activity, Gauge, LayoutGrid, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

// Mission Control Component
const MissionControl = () => {
  const [score, setScore] = useState(100);
  const [checks, setChecks] = useState([
    { name: "Re-entrancy", status: "ok" },
    { name: "Access Control", status: "ok" },
    { name: "Integer Overflow", status: "ok" },
    { name: "Gas Limit", status: "ok" }
  ]);
  const [scanningLine, setScanningLine] = useState(0);

  useEffect(() => {
    const cycle = async () => {
      setScore(100);
      setChecks(c => c.map(x => ({ ...x, status: "ok" })));
      setScanningLine(0);
      await new Promise(r => setTimeout(r, 2000));
      setScanningLine(1); 
      setScore(45);
      setChecks(c => c.map(x => x.name === "Access Control" ? ({ ...x, status: "fail" }) : x));
      await new Promise(r => setTimeout(r, 2000));
      setChecks(c => c.map(x => x.name === "Access Control" ? ({ ...x, status: "fixing" }) : x));
      await new Promise(r => setTimeout(r, 1000));
      cycle();
    };
    cycle();
  }, []);

  const [code, setCode] = useState("");
  const [showFix, setShowFix] = useState(false);
  
  const vulnerableCode = `function recv_internal(int msg_value, cell in_msg_full, slice in_msg_body) {
    if (in_msg_body.slice_empty?()) { return (); }
    
    // Vulnerable: No access control
    int op = in_msg_body~load_uint(32);
    
    if (op == 1) {
      // Withdraw all funds
      send_raw_message(msg, 128);
    }
}`;

  const fixedCode = `function recv_internal(int msg_value, cell in_msg_full, slice in_msg_body) {
    if (in_msg_body.slice_empty?()) { return (); }
    
    // Fixed: Access control added
    throw_unless(401, equal_slices(sender_address, owner_address));
    int op = in_msg_body~load_uint(32);
    
    if (op == 1) {
      // Withdraw all funds
      send_raw_message(msg, 128);
    }
}`;

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setCode(vulnerableCode.substring(0, i));
      i++;
      if (i > vulnerableCode.length) {
        clearInterval(interval);
        setTimeout(() => setShowFix(true), 1000);
      }
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-lg mx-auto bg-neutral-900/95 backdrop-blur-xl rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 flex flex-col relative z-10 transform hover:scale-[1.02] transition-transform duration-500">
        <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="relative">
                    <div className="absolute inset-0 bg-green-500 blur-[4px] opacity-50 animate-pulse"></div>
                    <Activity className="h-4 w-4 text-green-400 relative z-10" />
                </div>
                <span className="text-xs font-mono text-green-400 tracking-wider">SYSTEM_ACTIVE</span>
            </div>
            <div className="text-xs font-mono text-neutral-500">Target: wallet.fc</div>
        </div>
        <div className="flex h-[380px]">
            <div className="flex-1 bg-[#0d1117]/50 p-5 font-mono text-xs text-neutral-400 border-r border-white/5 overflow-hidden relative">
                <div className="absolute left-0 top-10 w-full h-8 bg-gradient-to-r from-red-500/20 to-transparent border-l-2 border-red-500 transition-opacity duration-300" style={{ opacity: score < 50 ? 1 : 0 }}></div>
                <div className="space-y-2 leading-relaxed">
                    <div className="text-neutral-600 italic">// Analyzing Smart Contract...</div>
                    <div><span className="text-purple-400">function</span> <span className="text-blue-400">run_tick</span>() &#123;</div>
                    <div className="pl-4 text-neutral-300">int balance = <span className="text-yellow-300">get_balance</span>();</div>
                    <div className="pl-4 text-purple-300">if (op == 1) &#123;</div>
                    <div className="pl-8 text-white bg-white/5 rounded px-1">send_raw_message(msg, 128);</div>
                    <div className="pl-4">&#125;</div>
                    <div>&#125;</div>
                </div>
                {checks.find(c => c.status === "fixing") && (
                     <div className="absolute inset-0 bg-green-900/20 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="bg-green-500 text-black px-4 py-2 rounded-full text-xs font-bold animate-bounce shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                            Applying Auto-Patch...
                        </div>
                     </div>
                )}
            </div>
            <div className="w-56 bg-black/20 p-5 flex flex-col gap-6">
                <div className="text-center p-4 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="text-[10px] text-neutral-400 mb-1 uppercase tracking-widest font-semibold">Security Score</div>
                    <div className={`text-4xl font-black tracking-tighter transition-all duration-500 ${score > 80 ? "text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]" : "text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]"}`}>
                        {score}
                    </div>
                </div>
                <div className="flex-1 space-y-2.5">
                    {checks.map((check, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] p-2.5 rounded-lg bg-white/5 border border-white/5 transition-colors">
                            <span className="text-neutral-300 font-medium">{check.name}</span>
                            {check.status === "ok" && <CheckCircle className="h-3.5 w-3.5 text-green-400" />}
                            {check.status === "fail" && <AlertTriangle className="h-3.5 w-3.5 text-red-400 animate-pulse" />}
                            {check.status === "fixing" && <Zap className="h-3.5 w-3.5 text-yellow-400 animate-spin" />}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );

};




export default function Home() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-blue-100">
      <header className="sticky top-0 z-50 w-full border-b border-neutral-100 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo />
          <Link href="/auditor">
            <Button className="bg-neutral-900 text-white hover:bg-neutral-800 transition-all hover:scale-105 shadow-lg shadow-neutral-900/20">Get Started</Button>
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section - The Infinite Floor (Polished) */}
        <section className="py-24 md:py-32 px-4 border-b border-neutral-100 relative overflow-hidden bg-neutral-50">
           
           {/* 1. Vignette Overlay */}
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.8)_70%,#ffffff_100%)] z-10 pointer-events-none"></div>

           {/* 2. 3D Grid Floor - High Contrast Slate & Animation */}
           <div className="absolute inset-0 perspective-[1000px] overflow-hidden pointer-events-none">
               <div 
                 className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[linear-gradient(to_right,#94a3b8_1px,transparent_1px),linear-gradient(to_bottom,#94a3b8_1px,transparent_1px)] bg-[size:60px_60px] animate-[gridMove_20s_linear_infinite] opacity-40"
                 style={{ 
                     transform: "rotateX(60deg)",
                     transformOrigin: "center center"
                 }}
               ></div>
               {/* Horizon Fade */}
               <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-white/80"></div>
           </div>

           {/* 3. Floating Particles */}
           <div className="absolute inset-0 overflow-hidden pointer-events-none">
               <div className="absolute top-[20%] left-[10%] w-2 h-2 bg-blue-400/20 rounded-full blur-[1px] animate-float"></div>
               <div className="absolute top-[60%] right-[15%] w-3 h-3 bg-purple-400/20 rounded-full blur-[2px] animate-float-delayed"></div>
               <div className="absolute bottom-[20%] left-[30%] w-1 h-1 bg-blue-600/30 rounded-full animate-float"></div>
           </div>

          <div className="container mx-auto max-w-6xl relative z-20">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="text-left space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-2 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>The Standard for TON Security</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-neutral-900 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
                  Ship Secure <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">TON Contracts</span>
                </h1>
                <p className="text-xl text-neutral-600 leading-relaxed max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                Secure your TON smart contracts in seconds. Analyze your FunC & Tact code, fix vulnerabilities instantly, and export audit reports.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
                  <Link href="/auditor">
                    <Button size="lg" className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xl shadow-blue-600/20 transition-all hover:scale-105 hover:shadow-blue-600/40">
                      Audit My Code Now
                    </Button>
                  </Link>
                  {/* <Link href="#how-it-works">
                     <Button variant="outline" size="lg" className="h-14 px-8 text-lg border-neutral-200 text-neutral-600 hover:bg-white hover:text-neutral-900 rounded-xl shadow-sm hover:shadow-md bg-white/50 backdrop-blur-sm">
                      See Demo
                    </Button>
                  </Link> */}
                </div>
                
                {/* Social Proof */}
                {/* <div className="pt-8 border-t border-neutral-200/60 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400">
                    <p className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">Trusted By Builders On</p>
                    <div className="flex gap-6 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="h-8 w-24 bg-neutral-300 rounded animate-pulse"></div>
                        <div className="h-8 w-24 bg-neutral-300 rounded animate-pulse delay-100"></div>
                        <div className="h-8 w-24 bg-neutral-300 rounded animate-pulse delay-200"></div>
                    </div>
                </div> */}
              </div>

              <div className="relative lg:translate-x-10 animate-in fade-in zoom-in duration-1000 delay-200 perspective-1000">
                 <div className="absolute -inset-10 bg-gradient-to-tr from-blue-100 via-indigo-100 to-purple-100 rounded-full blur-3xl opacity-60 -z-10 animate-pulse"></div>
                 <div className="transform rotate-y-[-15deg] hover:rotate-0 transition-all duration-700 ease-out preserve-3d">
                    <MissionControl />
                 </div>
              </div>
            </div>
          </div>
          
          <style jsx>{`
            @keyframes gridMove {
                0% { transform: rotateX(60deg) translateY(0); }
                100% { transform: rotateX(60deg) translateY(60px); }
            }
            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-20px); }
            }
            @keyframes float-delayed {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-15px); }
            }
            .animate-float { animation: float 6s ease-in-out infinite; }
            .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; }
            .perspective-1000 { perspective: 1000px; }
            .preserve-3d { transform-style: preserve-3d; }
            .rotate-y-\[-15deg\] { transform: rotateY(-15deg) rotateX(0deg); }
          `}</style>
        </section>

                {/* Problem / Solution Grid */}
                <section id="features" className="py-24 bg-white border-y border-neutral-100">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4 text-neutral-900">Security Audits are Broken</h2>
              <p className="text-lg text-neutral-600">
                Manual audits cost $10k+ and take weeks. Existing tools don't support TON. 
                CryptoSecure bridges the gap with automated, instant intelligence.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <Card className="border border-neutral-200 shadow-sm hover:shadow-md transition-all group">
                <CardHeader>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors duration-300">
                    <Zap className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-xl">Instant Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600 leading-relaxed">
                    Stop waiting weeks for feedback. Our engine scans your code in seconds using static analysis and heuristics tailored for TON's unique architecture.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="border border-neutral-200 shadow-sm hover:shadow-md transition-all group">
                <CardHeader>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors duration-300">
                    <Wand2 className="h-6 w-6 text-purple-600 group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-xl">Auto-Fix Engine</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600 leading-relaxed">
                    Don't just find bugs—fix them. We automatically generate patched code for common vulnerabilities. Review changes in our built-in diff viewer.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="border border-neutral-200 shadow-sm hover:shadow-md transition-all group">
                <CardHeader>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors duration-300">
                    <FileText className="h-6 w-6 text-green-600 group-hover:text-white transition-colors" />
                  </div>
                  <CardTitle className="text-xl">Professional Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600 leading-relaxed">
                    Generate audit-ready PDF reports with severity scoring, impact analysis, and executive summaries. Perfect for sharing with investors and partners.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Deep Dive / Visual Section */}
        <section className="py-24 px-4 bg-neutral-50">
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div>
                  <div className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 mb-4">
                    Developer Experience
                  </div>
                  <h2 className="text-4xl font-bold mb-6 text-neutral-900">Fix vulnerabilities with a single click</h2>
                  <p className="text-lg text-neutral-600 leading-relaxed">
                    Reviewing security issues shouldn't be a headache. Our interactive <strong>Diff Viewer</strong> shows you exactly what's wrong and how to fix it.
                  </p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="mt-1 bg-green-100 p-2 rounded-full text-green-700">
                            <CheckCircle className="h-4 w-4" />
                        </div>
                        <div>
                            <h4 className="font-bold text-neutral-900">Side-by-Side Comparison</h4>
                            <p className="text-neutral-600 text-sm">Visualize changes clearly with color-coded diffs.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="mt-1 bg-green-100 p-2 rounded-full text-green-700">
                            <CheckCircle className="h-4 w-4" />
                        </div>
                        <div>
                            <h4 className="font-bold text-neutral-900">Manual Override</h4>
                            <p className="text-neutral-600 text-sm">Fine-tune the AI's suggestions before accepting them.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="mt-1 bg-green-100 p-2 rounded-full text-green-700">
                            <CheckCircle className="h-4 w-4" />
                        </div>
                        <div>
                            <h4 className="font-bold text-neutral-900">Export & Share</h4>
                            <p className="text-neutral-600 text-sm">Download the patched code or the full audit report.</p>
                        </div>
                    </div>
                </div>
              </div>

              {/* Abstract visual representation of the interface */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-neutral-200 bg-white">
                 <div className="bg-neutral-900 px-4 py-3 flex items-center gap-2 border-b border-neutral-800">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="ml-4 px-3 py-1 bg-neutral-800 rounded text-xs text-neutral-400 font-mono">
                        secure-wallet.fc
                    </div>
                 </div>
                 <div className="p-6 font-mono text-sm overflow-hidden bg-neutral-50">
                    <div className="space-y-1">
                        <div className="flex text-neutral-400">
                            <span className="w-8 opacity-50">12</span>
                            <span>function recv_internal(int msg_value, cell in_msg_full, slice in_msg_body) &#123;</span>
                        </div>
                        <div className="flex text-neutral-400">
                            <span className="w-8 opacity-50">13</span>
                            <span className="pl-4">if (in_msg_body.slice_empty?()) &#123; return (); &#125;</span>
                        </div>
                        <div className="flex bg-green-100 text-green-800 border-l-4 border-green-500 py-1 my-1">
                            <span className="w-8 opacity-50 text-right pr-2 select-none">+</span>
                            <span className="pl-4">throw_unless(401, equal_slices(sender_address, owner_address));</span>
                        </div>
                        <div className="flex text-neutral-400">
                            <span className="w-8 opacity-50">14</span>
                            <span className="pl-4">int op = in_msg_body~load_uint(32);</span>
                        </div>
                         <div className="flex text-neutral-400">
                            <span className="w-8 opacity-50">15</span>
                            <span className="pl-4">...</span>
                        </div>
                    </div>
                 </div>
                 <div className="bg-white p-4 border-t flex justify-between items-center">
                     <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                         <ShieldCheck className="h-4 w-4" />
                         <span>Vulnerability Patched</span>
                     </div>
                     <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        Accept Fix
                     </Button>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works Steps */}
        <section id="how-it-works" className="py-24 bg-white">
          <div className="container mx-auto px-4 text-center">
            <div className="mb-16">
                <h2 className="text-3xl font-bold mb-4 text-neutral-900">From Code to Secure in 3 Steps</h2>
                <p className="text-neutral-600 max-w-2xl mx-auto">Our streamlined process is designed for developer velocity.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto relative">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-100 via-purple-100 to-green-100 z-0"></div>

              {/* Step 1 */}
              <div className="relative z-10 flex flex-col items-center group">
                <div className="h-24 w-24 bg-white border-4 border-blue-50 rounded-full flex items-center justify-center mb-6 shadow-lg group-hover:border-blue-200 transition-all duration-300">
                  <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <FileCode className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-neutral-900">1. Upload Code</h3>
                <p className="text-neutral-600 text-sm max-w-xs">
                    Drag & drop your .fc, .tact files or paste a snippet directly into the editor.
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative z-10 flex flex-col items-center group">
                <div className="h-24 w-24 bg-white border-4 border-purple-50 rounded-full flex items-center justify-center mb-6 shadow-lg group-hover:border-purple-200 transition-all duration-300">
                  <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                    <Shield className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-neutral-900">2. Analyze & Fix</h3>
                <p className="text-neutral-600 text-sm max-w-xs">
                    AI detects vulnerabilities and proposes code fixes. You review and approve the changes.
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative z-10 flex flex-col items-center group">
                <div className="h-24 w-24 bg-white border-4 border-green-50 rounded-full flex items-center justify-center mb-6 shadow-lg group-hover:border-green-200 transition-all duration-300">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <FileText className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-neutral-900">3. Get Report</h3>
                <p className="text-neutral-600 text-sm max-w-xs">
                    Download a comprehensive PDF report detailing the audit results and applied fixes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-neutral-900 text-white text-center px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
          <div className="container mx-auto max-w-3xl relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Ready to secure your contract?
            </h2>
            <p className="text-xl text-neutral-400 mb-10 max-w-2xl mx-auto">
              Join developers building secure DeFi, Gaming, and NFT projects on TON.
            </p>
            <Link href="/auditor">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-16 px-12 text-lg rounded-full shadow-2xl shadow-blue-900/50 transition-all hover:scale-105">
                Start Free Audit <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="mt-6 text-sm text-neutral-500">
                No credit card required. Supports FunC & Tact.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
