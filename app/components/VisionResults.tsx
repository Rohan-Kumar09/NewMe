"use client";
import { useState } from "react";
import type { VisionValidationResult } from "../utils/visionValidation";

interface VisionResultsProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
  labels: Array<{ description: string; score: number }> | null;
  raw: any | null;
  validation?: VisionValidationResult | null;
}

export default function VisionResults({ isOpen, onClose, isLoading, error, labels, raw, validation }: VisionResultsProps) {
  const [showRaw, setShowRaw] = useState(false);

  if (!isOpen) return null;

  return (
    <div className=" bg-white rounded-md shadow-md p-4 mr-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Vision Results</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowRaw((s) => !s)}
            className="px-2 py-1 text-sm border rounded bg-gray-100"
          >
            {showRaw ? "Hide Raw" : "Show Raw"}
          </button>
          <button
            onClick={onClose}
            className="px-2 py-1 text-sm border rounded bg-red-100"
          >
            Dismiss
          </button>
        </div>
      </div>

      {isLoading && <div className="mt-2">Loading analysis...</div>}

      {error && (
        <div className="mt-2 text-red-600">Error running Vision: {error}</div>
      )}

      {/* Validation Status */}
      {!isLoading && validation && (
        <div className="mt-3 p-3 bg-gray-50 rounded border">
          <div className="text-sm font-medium mb-2">Image Validation</div>
          
          {/* Face Detection Status */}
          <div className="flex items-center space-x-2 mb-1">
            <span className={validation.hasDetectedFace ? "text-green-600" : "text-red-600"}>
              {validation.hasDetectedFace ? "✓" : "✗"}
            </span>
            <span className="text-sm">
              {validation.hasDetectedFace 
                ? `Face detected (${validation.faceCount})` 
                : "No face detected"}
            </span>
          </div>

          {/* Safety Check Status */}
          <div className="flex items-center space-x-2 mb-1">
            <span className={validation.isSafeContent ? "text-green-600" : "text-red-600"}>
              {validation.isSafeContent ? "✓" : "✗"}
            </span>
            <span className="text-sm">
              {validation.isSafeContent ? "Content safe" : "Inappropriate content"}
            </span>
          </div>

          {/* Overall Status */}
          <div className="flex items-center space-x-2 mt-2 pt-2 border-t">
            <span className={validation.isValid ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
              {validation.isValid ? "✓ Ready for processing" : "✗ Cannot process"}
            </span>
          </div>

          {/* Error Message */}
          {validation.errorMessage && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              {validation.errorMessage}
            </div>
          )}

          {/* Warnings */}
          {validation.warnings.length > 0 && (
            <div className="mt-2 space-y-1">
              {validation.warnings.map((warning, idx) => (
                <div key={idx} className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
                  ⚠️ {warning}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isLoading && !error && labels && (
        <div className="mt-3">
          <div className="text-sm text-gray-600 mb-2">Top labels (description — score)</div>
          <ul className="list-disc pl-5 space-y-1 columns-2">
            {labels.map((l, idx) => (
              <li key={idx} className="text-sm">
                <strong>{l.description}</strong> — {(l.score * 100).toFixed(1)}%
              </li>
            ))}
          </ul>
        </div>
      )}

      {showRaw && (
        <div className="mt-3">
          <pre className="max-h-[220px] overflow-auto text-xs bg-gray-50 p-2 rounded">
            {JSON.stringify(raw, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
