"use client";
import { useState } from "react";

interface VisionResultsProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
  labels: Array<{ description: string; score: number }> | null;
  raw: any | null;
}

export default function VisionResults({ isOpen, onClose, isLoading, error, labels, raw }: VisionResultsProps) {
  const [showRaw, setShowRaw] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="w-[310px] bg-white rounded-md shadow-md p-4 mb-4">
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

      {!isLoading && !error && labels && (
        <div className="mt-3">
          <div className="text-sm text-gray-600 mb-2">Top labels (description — score)</div>
          <ul className="list-disc pl-5 space-y-1">
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
