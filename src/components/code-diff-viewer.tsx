"use client";

import { ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import * as Diff from 'diff';
import { useMemo, forwardRef, useImperativeHandle, useRef } from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

interface CodeDiffViewerProps {
  originalCode: string;
  patchedCode: string;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
}

export const CodeDiffViewer = forwardRef<{ scrollTo: (top: number) => void }, CodeDiffViewerProps>(
    ({ originalCode, patchedCode, onScroll }, ref) => {
  
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
      scrollTo: (top: number) => {
          if (scrollViewportRef.current) {
              scrollViewportRef.current.scrollTop = top;
          }
      }
  }));

  // Use the 'diff' library to calculate differences
  const diffChanges = useMemo(() => {
     return Diff.diffLines(originalCode, patchedCode, { newlineIsToken: false });
  }, [originalCode, patchedCode]);

  // We need to reconstruct the lines to show line numbers properly
  // Diff library returns blocks of added/removed/common text
  
  const renderDiff = () => {
      const lines: React.ReactNode[] = [];
      let originalLineNumber = 1;
      let patchedLineNumber = 1;

      diffChanges.forEach((part, partIdx) => {
          // Split content into lines, handling trailing newlines carefully
          // diffLines usually preserves newlines at the end of strings
          const partLines = part.value.split('\n');
          if (partLines[partLines.length - 1] === '') partLines.pop();

          if (part.added) {
              // Green lines (Added)
              partLines.forEach((line, lineIdx) => {
                  lines.push(
                      <div key={`add-${partIdx}-${lineIdx}`} className="flex bg-green-900/20 text-green-300">
                          <div className="w-12 flex-shrink-0 text-right mr-4 select-none border-r border-green-900/50 pr-2 opacity-50 text-xs py-0.5 font-mono">
                              {/* No original line number */}
                              <span className="text-transparent">.</span>
                          </div>
                          <div className="w-12 flex-shrink-0 text-right mr-4 select-none border-r border-green-900/50 pr-2 opacity-80 text-xs py-0.5 font-mono">
                              {patchedLineNumber++}
                          </div>
                          <pre className="flex-1 whitespace-pre-wrap break-all font-mono text-sm py-0.5 pl-2">
                              <span className="select-none mr-2 opacity-50">+</span>{line}
                          </pre>
                      </div>
                  );
              });
          } else if (part.removed) {
              // Red lines (Removed)
              partLines.forEach((line, lineIdx) => {
                  lines.push(
                      <div key={`del-${partIdx}-${lineIdx}`} className="flex bg-red-900/20 text-red-300 opacity-80">
                          <div className="w-12 flex-shrink-0 text-right mr-4 select-none border-r border-red-900/50 pr-2 opacity-80 text-xs py-0.5 font-mono">
                              {originalLineNumber++}
                          </div>
                          <div className="w-12 flex-shrink-0 text-right mr-4 select-none border-r border-red-900/50 pr-2 opacity-50 text-xs py-0.5 font-mono">
                              {/* No patched line number */}
                              <span className="text-transparent">.</span>
                          </div>
                          <pre className="flex-1 whitespace-pre-wrap break-all font-mono text-sm py-0.5 pl-2 line-through decoration-red-500/50">
                              <span className="select-none mr-2 opacity-50">-</span>{line}
                          </pre>
                      </div>
                  );
              });
          } else {
              // Unchanged lines
              partLines.forEach((line, lineIdx) => {
                  lines.push(
                      <div key={`same-${partIdx}-${lineIdx}`} className="flex text-neutral-400 hover:bg-neutral-900/50">
                          <div className="w-12 flex-shrink-0 text-right mr-4 select-none border-r border-neutral-800 pr-2 opacity-30 text-xs py-0.5 font-mono">
                              {originalLineNumber++}
                          </div>
                          <div className="w-12 flex-shrink-0 text-right mr-4 select-none border-r border-neutral-800 pr-2 opacity-30 text-xs py-0.5 font-mono">
                              {patchedLineNumber++}
                          </div>
                          <pre className="flex-1 whitespace-pre-wrap break-all font-mono text-sm py-0.5 pl-2">
                              <span className="select-none mr-2 opacity-0"> </span>{line}
                          </pre>
                      </div>
                  );
              });
          }
      });

      return lines;
  };

  return (
    <div className="rounded-md border bg-neutral-950 font-mono text-sm overflow-hidden shadow-2xl h-full flex flex-col">
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800">
        <span className="text-xs font-bold text-neutral-400 tracking-wider">PATCH PREVIEW</span>
        <div className="flex gap-4 text-xs font-medium">
            <span className="flex items-center gap-2 text-red-400"><div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_4px_rgba(239,68,68,0.5)]"></div> Removed</span>
            <span className="flex items-center gap-2 text-green-400"><div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_4px_rgba(34,197,94,0.5)]"></div> Added</span>
        </div>
      </div>
      
      {/* Custom ScrollArea Implementation to access viewport ref directly */}
      <ScrollAreaPrimitive.Root className="relative overflow-hidden flex-1 w-full">
        <ScrollAreaPrimitive.Viewport 
            ref={scrollViewportRef} 
            className="h-full w-full rounded-[inherit]"
            onScroll={onScroll}
        >
            <div className="min-w-[600px] p-4 space-y-0.5">
                {renderDiff()}
            </div>
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar />
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    </div>
  );
});

CodeDiffViewer.displayName = "CodeDiffViewer";
