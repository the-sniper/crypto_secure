"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  Bug, 
  ShieldAlert, 
  Info, Upload, FileCode, X, FileText, Circle, 
  ChevronDown, 
  ChevronUp, 
  AlertOctagon,
  Wand2,
  Pencil
} from "lucide-react";
import { AnalysisResult, Vulnerability } from "@/types/analysis";
import { AnalysisChat } from "@/components/analysis-chat";
import { CodeDiffViewer } from "@/components/code-diff-viewer";

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
  const [currentStep, setCurrentStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [showDiff, setShowDiff] = useState(false);
  const [isEditingFix, setIsEditingFix] = useState(false);
  const [modifiedFix, setModifiedFix] = useState("");

  // Refs for sync scrolling
  const diffViewerRef = useRef<{ scrollTo: (top: number) => void }>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const isScrollingRef = useRef<boolean>(false);

  const handleDiffScroll = (e: React.UIEvent<HTMLDivElement>) => {
      if (isScrollingRef.current) return;
      isScrollingRef.current = true;
      if (editorRef.current) {
          editorRef.current.scrollTop = e.currentTarget.scrollTop;
      }
      // Reset lock after a short delay to allow other scroll event to fire if needed,
      // but for 1-way binding usually we want to avoid loop.
      // Actually, better to use requestAnimationFrame or simple timeout
      setTimeout(() => { isScrollingRef.current = false; }, 10);
  };

  const handleEditorScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
      if (isScrollingRef.current) return;
      isScrollingRef.current = true;
      if (diffViewerRef.current) {
          diffViewerRef.current.scrollTo(e.currentTarget.scrollTop);
      }
      setTimeout(() => { isScrollingRef.current = false; }, 10);
  };

  // Progress steps for analysis - aligned with actual analysis process
  const progressSteps = [
    { 
      title: "Parsing contract code", 
      description: "Reading and validating syntax",
      duration: 1500 
    },
    { 
      title: "Analyzing contract logic", 
      description: "Identifying functions and patterns",
      duration: 2000 
    },
    { 
      title: "Scanning for vulnerabilities", 
      description: "Checking security patterns",
      duration: 2500 
    },
    { 
      title: "Generating security report", 
      description: "Compiling findings",
      duration: 1500 
    },
  ];
  const [activeTab, setActiveTab] = useState<"upload" | "snippet">("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileContent, setUploadedFileContent] = useState<string>("");
  const [snippetCode, setSnippetCode] = useState<string>("");
  const [snippetLanguage, setSnippetLanguage] = useState<LanguageType | "">("");
  const [codeValidationError, setCodeValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressCancelledRef = useRef(false);

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
    setShowDiff(false);
    setIsEditingFix(false);
    setCurrentStep(0);

    try {
      progressCancelledRef.current = false;
      
      // Start progress simulation (runs independently, doesn't block API)
      const progressPromise = (async () => {
        for (let i = 0; i < progressSteps.length; i++) {
          if (progressCancelledRef.current) break;
          setCurrentStep(i);
          await new Promise(resolve => setTimeout(resolve, progressSteps[i].duration));
        }
        if (!progressCancelledRef.current) {
          setCurrentStep(progressSteps.length - 1);
        }
      })();

      // Make API call - this is what we actually wait for
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: currentCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "Analysis failed");
      }

      // Cancel progress and show results after minimum delay
      progressCancelledRef.current = true;
      setCurrentStep(progressSteps.length - 1);
      
      // Artificial 2 second delay to show progress indicator
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsAnalyzing(false);
      setCurrentStep(0);
      progressCancelledRef.current = false;
    }
  };

  const handleReviewClick = () => {
      if (result?.patchedCode) {
          setModifiedFix(result.patchedCode);
          setShowDiff(true);
          setIsEditingFix(false);
      }
  };

  const handleAcceptFix = () => {
      if (activeTab === "upload") {
          setActiveTab("snippet");
      }
      setSnippetCode(modifiedFix);
      setShowDiff(false);
      setIsEditingFix(false);
      setResult(null); 
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle>Smart Contract Auditor</CardTitle>
          <CardDescription>
            Upload your contract files or paste code below for an instant security check.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {!showDiff ? (
          <>
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

          {/* Scan in Progress - Replaces upload/snippet area */}
          {isAnalyzing ? (
            <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 bg-neutral-50 h-[300px] flex items-center justify-center">
              <div className="w-full max-w-xl space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-1">Scan in progress...</h3>
                  <p className="text-sm text-neutral-600">Analyzing your smart contract for security vulnerabilities</p>
                </div>
                
                <div className="space-y-0">
                  {progressSteps.map((step, index) => {
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    const isPending = index > currentStep;
                    const isLast = index === progressSteps.length - 1;
                    
                    return (
                      <div key={index} className="flex items-start gap-3">
                        {/* Progress Indicator */}
                        <div className="flex flex-col items-center flex-shrink-0">
                          {isCompleted ? (
                            <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center shadow-sm">
                              <CheckCircle className="h-3.5 w-3.5 text-white" />
                            </div>
                          ) : isActive ? (
                            <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center shadow-sm">
                              <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-neutral-300 bg-white"></div>
                          )}
                          {/* Simple connecting line */}
                          {!isLast && (
                            <div className={`w-0.5 h-6 mt-1.5 ${
                              isCompleted ? "bg-green-600" : "bg-neutral-200"
                            }`}></div>
                          )}
                        </div>
                        
                        {/* Step Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium leading-tight ${
                            isActive ? "text-purple-700" : 
                            isCompleted ? "text-green-700" : 
                            "text-neutral-400"
                          }`}>
                            {step.title}
                          </p>
                          {step.description && isActive && (
                            <p className="text-xs text-neutral-500 mt-0.5 leading-tight">{step.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
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
          {error && activeTab === "upload" && !isAnalyzing && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* Snippet Tab */}
          {activeTab === "snippet" && !isAnalyzing && (
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
              {error && activeTab === "snippet" && !isAnalyzing && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}
            </div>
          )}
            </>
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
            <div className="space-y-8 animate-in fade-in slide-in-from-top-4">
              
              {/* 1. Executive Summary & Score */}
              <div className="grid gap-6 md:grid-cols-[1fr_200px]">
                <div className="p-5 rounded-xl border bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-950 shadow-sm">
                  <h3 className="font-bold text-lg mb-2">Scan Results</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-4">{result.summary}</p>
                  {result.patchedCode && (
                    <Button 
                      onClick={handleReviewClick} 
                      className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                    >
                      <Wand2 className="h-4 w-4" /> 
                      Review Auto-Fixes
                    </Button>
                  )}
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

              {/* Chat Interface */}
              <AnalysisChat />

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
          </>
        ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
             <div className="flex items-center justify-between mb-4">
               <div>
                 <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Review Security Patch</h3>
                 <p className="text-sm text-neutral-500">Review the AI-generated fix and make manual adjustments if needed.</p>
               </div>
               <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowDiff(false)}>Cancel</Button>
                  <Button onClick={handleAcceptFix} className="bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Apply Fix
                  </Button>
               </div>
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
                <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-neutral-950">
                   <div className="bg-neutral-900 px-4 py-2 border-b border-neutral-800 flex justify-between items-center">
                      <h4 className="font-mono text-xs font-bold text-neutral-400 uppercase tracking-wider">Diff View</h4>
                   </div>
                   <div className="flex-1 min-h-0 relative">
                      <CodeDiffViewer 
                         ref={diffViewerRef}
                         originalCode={getCurrentCode()}
                         patchedCode={modifiedFix}
                         onScroll={handleDiffScroll}
                      />
                   </div>
                </div>

                <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-white dark:bg-neutral-900">
                   <div className="bg-neutral-50 dark:bg-neutral-800 px-4 py-2 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
                      <h4 className="font-mono text-xs font-bold text-neutral-500 uppercase tracking-wider">Editable Fix</h4>
                      <div className="flex items-center gap-2">
                         <Pencil className="h-3 w-3 text-neutral-400" />
                         <span className="text-xs text-neutral-400">Editable</span>
                      </div>
                   </div>
                   <Textarea 
                      ref={editorRef}
                      value={modifiedFix}
                      onChange={(e) => setModifiedFix(e.target.value)}
                      onScroll={handleEditorScroll}
                      className="flex-1 w-full h-full font-mono text-sm resize-none p-4 border-0 focus-visible:ring-0 rounded-none leading-normal"
                      spellCheck={false}
                   />
                </div>
             </div>
           </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
