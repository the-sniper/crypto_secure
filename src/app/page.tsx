import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, AlertTriangle, Zap, Code, Lock, Terminal } from "lucide-react";
import Link from "next/link";
import { CodeAnalyzer } from "@/components/code-analyzer";

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold tracking-tight">CryptoSecure</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#problem" className="text-sm font-medium hover:text-blue-600">The Problem</Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-blue-600">How it Works</Link>
          </nav>
          <Link href="#audit">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-24 md:py-32 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border bg-blue-50 px-3 py-1 text-sm text-blue-600">
              <span className="mr-2 font-semibold">New:</span> Support for TON Smart Contracts
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl mb-6">
              Blah Blah for <span className="text-blue-600">Money Apps</span>
            </h1>
            <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
              Secure your TON smart contracts in seconds. No PhD required. 
              Detect vulnerabilities before hackers do.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="#audit">
                <Button size="lg" className="h-12 px-8 text-lg">
                  Audit My Code
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Audit Tool Section */}
        <section id="audit" className="py-12 px-4 bg-white border-y scroll-mt-20">
          <div className="container mx-auto">
            <CodeAnalyzer />
          </div>
        </section>

        {/* The Problem (Alex's Story) */}
        <section id="problem" className="py-24 bg-white border-y">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Why This Matters</h2>
              <p className="text-lg text-neutral-600">
                Imagine your friend Alex. He just learned to code and built "TipJar" on TON.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-700 flex items-center gap-2">
                    <Zap className="h-5 w-5" /> The Rise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-700 mb-4">
                    TipJar goes viral. Musicians love it.
                  </p>
                  <div className="text-4xl font-bold text-green-600 mb-2">$50,000</div>
                  <p className="text-sm text-neutral-500">Daily volume flowing through the app.</p>
                </CardContent>
              </Card>

              <Card className="bg-red-50 border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" /> The Fall
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-700 mb-4">
                    One missing security check. A hacker finds it.
                  </p>
                  <div className="text-4xl font-bold text-red-600 mb-2">$0.00</div>
                  <p className="text-sm text-neutral-500">Stolen in 10 minutes. Gone forever.</p>
                </CardContent>
              </Card>
            </div>

            <div className="max-w-2xl mx-auto mt-12 text-center p-6 bg-neutral-100 rounded-xl">
              <p className="text-neutral-700 font-medium">
                "Professional audits cost $10k+ and take weeks. Alex couldn't afford that. 
                So he hoped for the best. Hackers know this."
              </p>
            </div>
          </div>
        </section>

        {/* The Analogy */}
        <section className="py-24 px-4 bg-neutral-50">
          <div className="container mx-auto max-w-4xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">The Vending Machine</h2>
                <p className="text-lg text-neutral-600 mb-4">
                  Traditional apps are like vending machines managed by banks. Secure, but slow and expensive.
                </p>
                <p className="text-lg text-neutral-600 mb-4">
                  <strong>Smart Contracts</strong> are vending machines anyone can program. 
                  If you program it wrong (e.g., "Press Cancel to get chips AND refund"), 
                  hackers will empty it instantly.
                </p>
              </div>
              <div className="relative bg-white p-8 rounded-2xl shadow-xl border">
                <div className="absolute -top-4 -left-4 bg-blue-600 text-white p-3 rounded-lg shadow-lg">
                  <Code className="h-6 w-6" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-neutral-50 rounded border">
                    <span className="font-mono text-sm">deposit(100)</span>
                    <span className="text-green-600 text-sm">OK</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded border border-red-200">
                    <span className="font-mono text-sm">withdraw(all)</span>
                    <span className="text-red-600 text-sm font-bold">BUG FOUND!</span>
                  </div>
                  <div className="p-3 bg-blue-50 rounded text-sm text-blue-700">
                    <span className="font-bold">AI Suggestion:</span> Add access control check on line 42.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Solution / How it works */}
        <section id="how-it-works" className="py-24 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-16">How it Works</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-600">
                  <Terminal className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">1. Upload Code</h3>
                <p className="text-neutral-600">Paste your FunC or Tact smart contract code.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-6 text-purple-600">
                  <Zap className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">2. AI Analysis</h3>
                <p className="text-neutral-600">Our AI reads your code in 30 seconds, finding logic errors.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                  <Lock className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">3. Instant Fixes</h3>
                <p className="text-neutral-600">Get a simple report with exactly what to fix.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-neutral-900 text-white text-center px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Don't let your app become the next "TipJar".
            </h2>
            <p className="text-xl text-neutral-400 mb-8">
              Get a free security check for your TON smart contract today.
            </p>
            <Link href="#audit">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-14 px-10 text-lg">
                Start Free Audit
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
