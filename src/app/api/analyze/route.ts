import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { AnalysisResult } from "@/types/analysis";
import crypto from "crypto";
import { analyzeCodeStatic } from "@/lib/analyzer/engine";

// Simple in-memory cache for demo purposes
const analysisCache = new Map<string, any>();

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Invalid code provided" },
        { status: 400 }
      );
    }

    // Generate a hash of the NORMALIZED code (ignoring comments/whitespace)
    // This ensures comment changes do not affect the cache key either
    const normalizedCode = code.replace(/\s+/g, ' ').trim();
    const codeHash = crypto.createHash('sha256').update(normalizedCode).digest('hex');

    // Check cache first
    if (analysisCache.has(codeHash)) {
      console.log("Returning cached analysis result for hash:", codeHash);
      return NextResponse.json(analysisCache.get(codeHash));
    }

    // 1. Run Deterministic Static Analysis
    const staticResult = analyzeCodeStatic(code);

    // 2. (Optional) Enhance with AI for summary text only
    // We do NOT let the AI decide the score or findings list anymore.
    // It only provides the "summary" text based on the static findings.
    
    const apiKey = process.env.OPENAI_API_KEY;
    let aiSummary = staticResult.summary;

    if (apiKey) {
      try {
        const openai = new OpenAI({ apiKey });
        const prompt = `
You are a security assistant. I have statically analyzed a TON smart contract and found the following issues:
${JSON.stringify(staticResult.vulnerabilities, null, 2)}

Please write a 2-sentence executive summary for the developer. Be professional and encouraging.
`;
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7, 
        });
        aiSummary = completion.choices[0].message.content || aiSummary;
      } catch (e) {
        console.warn("AI summary generation failed, falling back to static summary.");
      }
    }

    const finalResult = {
      ...staticResult,
      summary: aiSummary
    };

    // Cache the result
    analysisCache.set(codeHash, finalResult);

    return NextResponse.json(finalResult);

  } catch (error: any) {
    console.error("Analysis failed:", error);
    return NextResponse.json(
      { 
        error: "Failed to analyze code.", 
        details: error.message || "Unknown error" 
      },
      { status: 500 }
    );
  }
}

