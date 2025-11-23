import { NextResponse } from "next/server";
import OpenAI from "openai";
import { AnalysisResult } from "@/types/analysis";
import crypto from "crypto";
import { SYSTEM_PROMPT, createAnalysisPrompt } from "@/lib/analyzer/prompts";

// Simple in-memory cache for demo purposes
const analysisCache = new Map<string, any>();

function extractContractName(filename?: string): string {
  if (!filename) return "contract";
  const nameWithoutExt = filename.replace(/\.(tact|fc|func)$/i, "");
  return nameWithoutExt || "contract";
}

function parseAIResponse(responseText: string): AnalysisResult {
  // Remove markdown code blocks if present
  let cleaned = responseText.trim();
  
  // Remove ```json and ``` markers
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
  cleaned = cleaned.trim();
  
  try {
    const parsed = JSON.parse(cleaned) as AnalysisResult;
    
    // Validate required fields
    if (!parsed.analysisMetadata || !parsed.securityScore || !parsed.grade || 
        !parsed.executiveSummary || !parsed.findingsSummary || !parsed.findings) {
      throw new Error("Missing required fields in AI response");
    }
    
    return parsed;
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    throw new Error("Invalid JSON response from AI");
  }
}

export async function POST(req: Request) {
  try {
    const { code, contractName, filename } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Invalid code provided" },
        { status: 400 }
      );
    }

    // Generate a hash of the normalized code for caching
    const normalizedCode = code.replace(/\s+/g, ' ').trim();
    const codeHash = crypto.createHash('sha256').update(normalizedCode).digest('hex');

    // Check cache first
    if (analysisCache.has(codeHash)) {
      console.log("Returning cached analysis result for hash:", codeHash);
      return NextResponse.json(analysisCache.get(codeHash));
    }

    // Extract contract name
    const finalContractName = contractName || extractContractName(filename);

    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: "OpenAI API key not configured",
          details: "Please set OPENAI_API_KEY environment variable"
        },
        { status: 500 }
      );
    }

    // Prompts
    const systemPrompt = SYSTEM_PROMPT;
    const analysisPrompt = createAnalysisPrompt(code, finalContractName);

    // Call OpenAI
    let aiResponse: AnalysisResult;
    try {
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: analysisPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
        response_format: { type: "json_object" }, // Request JSON format
      });

      const responseText = completion.choices[0].message.content;
      if (!responseText) {
        throw new Error("Empty response from AI");
      }

      // Parse the response
      aiResponse = parseAIResponse(responseText);
      
      // Add analysis date if not present
      if (!aiResponse.analysisMetadata.analysisDate) {
        aiResponse.analysisMetadata.analysisDate = new Date().toISOString();
      }

    } catch (error: any) {
      console.error("AI analysis failed:", error);
      return NextResponse.json(
        { 
          error: "Failed to analyze code with AI.", 
          details: error.message || "Unknown error",
          hint: "Please check your OpenAI API key and try again."
        },
        { status: 500 }
      );
    }

    // Cache the result
    analysisCache.set(codeHash, aiResponse);

    return NextResponse.json(aiResponse);

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

