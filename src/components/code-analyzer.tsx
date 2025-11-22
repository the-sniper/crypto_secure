"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Loader2, Bug, ShieldAlert, Info, Upload, FileCode, X, FileText } from "lucide-react";
import { AnalysisResult, Vulnerability } from "@/types/analysis";

// File size limit: 1MB (1024 * 1024 bytes)
const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const ALLOWED_FILE_TYPES = ['.tact', '.fc', '.func'];
const ALLOWED_LANGUAGES = ['tact', 'fc', 'func'] as const;
type LanguageType = typeof ALLOWED_LANGUAGES[number];

// Validate file type
const isValidFileType = (fileName: string): boolean => {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return ALLOWED_FILE_TYPES.includes(extension);
};

// Validate file size
const isValidFileSize = (fileSize: number): boolean => {
  return fileSize <= MAX_FILE_SIZE;
};

// Validate language type
const isValidLanguage = (language: string | LanguageType | ""): boolean => {
  if (!language || language === "") return false;
  return ALLOWED_LANGUAGES.includes(language.toLowerCase() as LanguageType);
};

// Detect code language from content
const detectCodeLanguage = (code: string): string | null => {
  const codeLower = code.toLowerCase().trim();
  
  // Check for Solidity patterns
  if (codeLower.includes('pragma solidity') || 
      codeLower.includes('contract ') || 
      codeLower.includes('library ') ||
      codeLower.includes('interface ') ||
      codeLower.includes('using ') ||
      codeLower.includes('modifier ') ||
      codeLower.includes('event ') ||
      codeLower.includes('enum ')) {
    return 'solidity';
  }
  
  // Check for Tact patterns
  if (codeLower.includes('import "@stdlib/') ||
      codeLower.includes('import std::') ||
      codeLower.includes('message ') ||
      codeLower.includes('init()') ||
      codeLower.includes('get()') ||
      codeLower.includes('receive()')) {
    return 'tact';
  }
  
  // Check for FunC patterns
  if (codeLower.includes('() recv_internal') ||
      codeLower.includes('() recv_external') ||
      codeLower.includes('() recv') ||
      codeLower.includes('() get_method_name') ||
      codeLower.includes('() get_balance') ||
      codeLower.includes('() throw_unless') ||
      codeLower.includes('() throw_if') ||
      codeLower.includes('() throw') ||
      codeLower.includes('() slice') ||
      codeLower.includes('() load_') ||
      codeLower.includes('() store_')) {
    return 'func';
  }
  
  // Check for FC patterns (Fift Continuation)
  if (codeLower.includes('{') && codeLower.includes('}') && 
      (codeLower.includes('dup') || codeLower.includes('swap') || codeLower.includes('rot'))) {
    return 'fc';
  }
  
  return null;
};

// Validate code matches selected language
const validateCodeLanguage = (code: string, selectedLanguage: string): { valid: boolean; message?: string } => {
  if (!code.trim() || !selectedLanguage) {
    return { valid: true }; // No validation needed if empty
  }
  
  const detectedLanguage = detectCodeLanguage(code);
  
  if (!detectedLanguage) {
    return { valid: true }; // Can't detect, allow it
  }
  
  // Map detected language to our language types
  const languageMap: Record<string, LanguageType> = {
    'solidity': 'func', // Solidity is not in our allowed list, but we'll treat it as invalid
    'tact': 'tact',
    'func': 'func',
    'fc': 'fc'
  };
  
  const mappedLanguage = languageMap[detectedLanguage];
  
  // If detected language doesn't match selected language
  if (mappedLanguage && mappedLanguage !== selectedLanguage.toLowerCase()) {
    if (detectedLanguage === 'solidity') {
      return { 
        valid: false, 
        message: `Detected Solidity code, but selected language is ${selectedLanguage.toUpperCase()}. Please select the correct language or paste ${selectedLanguage.toUpperCase()} code.` 
      };
    }
    return { 
      valid: false, 
      message: `Code appears to be ${detectedLanguage.toUpperCase()}, but selected language is ${selectedLanguage.toUpperCase()}. Please select the correct language.` 
    };
  }
  
  return { valid: true };
};

export function CodeAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "snippet">("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileContent, setUploadedFileContent] = useState<string>("");
  const [snippetCode, setSnippetCode] = useState<string>("");
  const [snippetLanguage, setSnippetLanguage] = useState<LanguageType | "">("");
  const [codeValidationError, setCodeValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear validation errors when code is cleared
  useEffect(() => {
    if (!snippetCode.trim()) {
      setCodeValidationError(null);
      if (activeTab === "snippet") {
        setError(null);
      }
    }
  }, [snippetCode, activeTab]);

  // Get the current code based on active tab
  const getCurrentCode = () => {
    return activeTab === "upload" ? uploadedFileContent : snippetCode;
  };

  // Check if scan button should be enabled
  const canScan = () => {
    if (activeTab === "upload") {
      return uploadedFile !== null && uploadedFileContent.trim() !== "";
    } else {
      // For snippet tab: need both code and valid language, and no validation errors
      const hasCode = snippetCode.trim() !== "";
      const hasValidLanguage = snippetLanguage !== "" && isValidLanguage(snippetLanguage);
      const hasNoValidationError = !codeValidationError;
      return hasCode && hasValidLanguage && hasNoValidationError;
    }
  };

  // Handle tab switch - clear the other tab's data
  const handleTabSwitch = (tab: "upload" | "snippet") => {
    if (tab === "upload") {
      // Switching to upload - clear snippet data
      setSnippetCode("");
      setSnippetLanguage("");
      setCodeValidationError(null);
    } else {
      // Switching to snippet - clear upload data
      setUploadedFile(null);
      setUploadedFileContent("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    setActiveTab(tab);
    setResult(null);
    setError(null);
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    if (!isValidFileType(file.name)) {
      setError(`Invalid file type. Please upload ${ALLOWED_FILE_TYPES.join(', ')} files only.`);
      return;
    }

    // Validate file size
    if (!isValidFileSize(file.size)) {
      const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
      setError(`File size exceeds the limit of ${maxSizeMB}MB. Please upload a smaller file.`);
      return;
    }

    setError(null);
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setUploadedFileContent(content);
    };
    reader.onerror = () => {
      setError("Failed to read file. Please try again.");
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadedFileContent("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyze = async () => {
    const currentCode = getCurrentCode();
    if (!currentCode.trim() || !canScan()) {
      if (activeTab === "snippet" && !snippetLanguage) {
        setError("Please select a language type before analyzing.");
      }
      return;
    }
    
    // Validate snippet language if in snippet tab
    if (activeTab === "snippet") {
      if (!snippetLanguage || !isValidLanguage(snippetLanguage)) {
        setError("Please select a valid language type (Tact, FC, or Func).");
        return;
      }
      
      // Validate code matches selected language
      const validation = validateCodeLanguage(currentCode, snippetLanguage);
      if (!validation.valid) {
        setError(validation.message || "Code language doesn't match selected language. Please select the correct language.");
        return;
      }
    }
    
    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: currentCode }),
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
          <CardDescription>Upload your contract files or paste code below for an instant security check.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 border-b border-neutral-200">
            <button
              onClick={() => handleTabSwitch("upload")}
              className={`px-6 py-3 font-medium text-sm transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "upload"
                  ? "border-purple-600 text-purple-600 bg-purple-50"
                  : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
              }`}
            >
              <Upload className="h-4 w-4" />
              Upload
            </button>
            <button
              onClick={() => handleTabSwitch("snippet")}
              className={`px-6 py-3 font-medium text-sm transition-all border-b-2 flex items-center gap-2 ${
                activeTab === "snippet"
                  ? "border-purple-600 text-purple-600 bg-purple-50"
                  : "border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
              }`}
            >
              <FileCode className="h-4 w-4" />
              Snippet
            </button>
          </div>

          {/* Upload Tab */}
          {activeTab === "upload" && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-8 transition-colors h-[300px] flex items-center justify-center ${
                isDragging
                  ? "border-purple-500 bg-purple-50"
                  : "border-purple-300 bg-neutral-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".tact,.fc,.func"
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              {uploadedFile ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-4">
                  <div className="w-full max-w-md bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
                    {/* File Header - Vertical Layout */}
                    <div className="flex items-start gap-3 px-4 py-3">
                      <div className="p-1.5 bg-purple-100 rounded flex-shrink-0">
                        <FileText className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-neutral-900 truncate text-sm">{uploadedFile.name}</p>
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded whitespace-nowrap">
                            Contract
                          </span>
                          <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                        </div>
                        <p className="text-xs text-neutral-500 mb-1">
                          {(uploadedFile.size / 1024).toFixed(2)} KB
                        </p>
                        <p className="text-xs text-green-700 font-medium">
                          Valid {uploadedFile.name.split('.').pop()?.toUpperCase()} file
                        </p>
                      </div>
                      <button
                        onClick={handleRemoveFile}
                        className="p-1 hover:bg-neutral-100 rounded transition-colors flex-shrink-0"
                        title="Remove file"
                      >
                        <X className="h-4 w-4 text-neutral-500" />
                      </button>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-1 bg-green-200">
                      <div className="h-full bg-green-600 w-full"></div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-neutral-600 mt-3">
                    File loaded successfully. Click "Scan for Bugs" to analyze.
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-4 w-full">
                  <div className="flex justify-center">
                    <div className="p-4 bg-purple-100 rounded-full">
                      <Upload className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-neutral-900 mb-2">Drop files here</p>
                    <p className="text-sm text-neutral-600 mb-4">
                      Attach contract files (.tact, .fc, .func) up to 1MB
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="text-purple-600 border-purple-300 hover:bg-purple-50"
                    >
                      Click to upload
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error: Upload tab errors - below the upload box */}
          {error && activeTab === "upload" && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Snippet Tab */}
          {activeTab === "snippet" && (
            <div className="space-y-3">
              {/* Language Selector */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-neutral-700">Language:</label>
                <div className="flex gap-2">
                  {ALLOWED_LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        // If switching to a different language, always clear the code and errors
                        if (snippetLanguage !== lang) {
                          setSnippetCode("");
                          setCodeValidationError(null);
                          setError(null);
                        }
                        setSnippetLanguage(lang);
                      }}
                      className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                        snippetLanguage === lang
                          ? "bg-purple-600 text-white"
                          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                      }`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              
              <Textarea
                placeholder="// Paste your smart contract code here..."
                className="h-[300px] font-mono text-sm resize-none overflow-y-auto focus-visible:border-purple-500 focus-visible:ring-purple-500/20 focus-visible:ring-[2px]"
                value={snippetCode}
                onChange={(e) => {
                  setSnippetCode(e.target.value);
                  const code = e.target.value.trim();
                  
                  // Validate code matches selected language
                  if (code && snippetLanguage && isValidLanguage(snippetLanguage)) {
                    const validation = validateCodeLanguage(code, snippetLanguage);
                    if (!validation.valid) {
                      const errorMsg = validation.message || "Code language doesn't match selected language.";
                      setCodeValidationError(errorMsg);
                      setError(errorMsg);
                    } else {
                      setCodeValidationError(null);
                      setError(null);
                    }
                  } else if (code && !snippetLanguage) {
                    setCodeValidationError(null);
                    setError(null); // Clear error, will show warning below
                  } else {
                    setCodeValidationError(null);
                    setError(null);
                  }
                }}
              />
              
              {/* Warning: Language not selected */}
              {snippetCode.trim() && (!snippetLanguage || !isValidLanguage(snippetLanguage)) && !error && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700 font-medium">
                    Please select a language type (Tact, FC, or Func) to proceed with analysis.
                  </p>
                </div>
              )}
              
              {/* Error: Code validation or other snippet errors */}
              {error && activeTab === "snippet" && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end">
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !canScan()}
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
