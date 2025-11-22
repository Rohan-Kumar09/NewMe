"use client";
import { useState, useEffect, useMemo } from "react";
import GooglePhotosPicker from "../components/GooglePhotosPickerNew";
import VisionResults from "../components/VisionResults";
import { downloadUrlAsFile } from "../utils/download";
import { validateVisionData } from "../utils/visionValidation";
import type { VisionValidationResult } from "../utils/visionValidation";
import { buildHairModificationPrompt, validateUserInput } from "../utils/geminiPrompt";
import { saveTransformation } from "../utils/saveTransformation";

export default function EditorPage() {
  const [color, setColor] = useState("");
  const [style, setStyle] = useState("");

  const [showColors, setShowColors] = useState(false); // 👈 controls list visibility
  const [showHairstyles, setShowHairstyles] = useState(false);

  const [isApplied, setIsApplied] = useState(false);
  
  // Download state
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Save to database state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(null);

  // Google Photos picker state
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  // Vision UI state
  const [visionData, setVisionData] = useState<any | null>(null);
  const [isVisionLoading, setIsVisionLoading] = useState(false);
  const [visionError, setVisionError] = useState<string | null>(null);
  const [showVisionPanel, setShowVisionPanel] = useState(false);
  const [visionValidation, setVisionValidation] = useState<VisionValidationResult | null>(null);

  // Gemini state
  const [isGenerating, setIsGenerating] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  // Monitor selectedPhoto state changes
  useEffect(() => {
    console.log('🔔 [STATE] selectedPhoto changed to:', selectedPhoto);
  }, [selectedPhoto]);

  // Monitor showPhotoPicker state changes
  useEffect(() => {
    console.log('🔔 [STATE] showPhotoPicker changed to:', showPhotoPicker);
  }, [showPhotoPicker]);

  const hairColors = [
    "Blonde",
    "Black",
    "Auburn",
    "Brown",
    "Red",
    "Silver",
    "Pink",
    "Lavender",
    "Blue Ombre",
    "Burgundy",
    "Vibrant Green",
  ];

  const trendingHairstyles = [
    "Ponytail",
    "Braid",
    "Bob Cut",
    "Curly Layers",
    "Pixie Cut",
    "Beach Waves",
    "Straight Bangs",
    "Braided Updo",
    "Shaggy Mullet",
    "Mohawk",
    "Bowl Cut",
    "Pompadour",
    "Fluffy Cut",
    "Buzz Cut",
    "Undercut",
    "Messy Fringe",
    "Man Bun",
    "Beard",
  ];

  function handlePhotoSelect(photoUrl: string, photoData: any) {
    console.log('🎯 [PAGE] handlePhotoSelect CALLED!');
    console.log('🎯 [PAGE] Photo URL received:', photoUrl);
    console.log('🎯 [PAGE] Photo data received:', photoData);
    console.log('🎯 [PAGE] Current selectedPhoto state:', selectedPhoto);
    console.log('🎯 [PAGE] Setting selectedPhoto to:', photoUrl);
    setSelectedPhoto(photoUrl);
    setOriginalPhotoUrl(photoUrl); // Store original photo URL
    setIsApplied(false); // Reset applied state when new photo is selected
    console.log('🎯 [PAGE] Closing photo picker...');
    setShowPhotoPicker(false);
    console.log('🔍 [PAGE] Automatically triggering Vision API analysis...');
    analyzePhoto(photoUrl);
    console.log('✅ [PAGE] handlePhotoSelect COMPLETE');
  }

  // Send selected (proxied/resized) image to server Vision endpoint
  async function analyzePhoto(photoUrl: string) {
    if (!photoUrl) return;
    setVisionError(null);
    setIsVisionLoading(true);
    try {
      // Create AbortController with 2 minute timeout for Vision API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes
      
      const res = await fetch('/api/photos/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: photoUrl }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Vision API error');
      }

      const data = await res.json();
      console.log('🔍 [VISION] Response', data);
      setVisionData(data);
      
      // Validate the Vision API results
      const validation = validateVisionData(data.visionResponse);
      setVisionValidation(validation);
      console.log('✅ [VALIDATION] Result:', validation);
      
      // Show validation errors if image is invalid
      if (!validation.isValid) {
        setVisionError(validation.errorMessage || 'Image validation failed');
        console.error('❌ [VALIDATION] Failed:', validation.errorMessage);
      } else if (validation.warnings.length > 0) {
        console.warn('⚠️ [VALIDATION] Warnings:', validation.warnings);
      }
      
      setShowVisionPanel(true); // Auto-open panel on successful analysis
    } catch (err) {
      console.error('❌ [VISION] Error', err);
      if (err instanceof Error && err.name === 'AbortError') {
        setVisionError('Vision API request timed out after 2 minutes. Please try again with a smaller image.');
      } else {
        setVisionError(err instanceof Error ? err.message : String(err));
      }
      setVisionValidation(null);
    } finally {
      setIsVisionLoading(false);
    }
  }

  // Download the currently selected photo using shared utility
  async function downloadSelectedPhoto() {
    if (!selectedPhoto) {
      console.warn('No selected photo to download');
      return;
    }

    try {
      setIsDownloading(true);
      await downloadUrlAsFile(selectedPhoto);
    } catch (err) {
      console.error('Error downloading image', err);
      alert('An unexpected error occurred while downloading the image.');
    } finally {
      setIsDownloading(false);
    }
  }

  // Save transformation to backend/database
  async function saveToDatabase() {
    if (!selectedPhoto || !originalPhotoUrl) {
      alert('Please select and transform a photo first.');
      return;
    }

    if (!isApplied) {
      alert('Please apply a transformation before saving.');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);

      const result = await saveTransformation(
        originalPhotoUrl,
        selectedPhoto,
        color || undefined,
        style || undefined
      );

      console.log('Transformation saved:', result);
      alert('Transformation saved successfully! You can view it in the Gallery.');
    } catch (err) {
      console.error('❌ [SAVE] Error saving transformation:', err);
      console.error('❌ [SAVE] Error details:', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : undefined,
      });
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to save transformation';
      setSaveError(errorMessage);
      
      // More detailed error message
      let userMessage = errorMessage;
      if (errorMessage.includes('fetch')) {
        userMessage = 'Failed to connect to server. Make sure the Express server is running on port 3001.';
      } else if (errorMessage.includes('401') || errorMessage.includes('Not authenticated')) {
        userMessage = 'Authentication failed. Please sign in again.';
      } else if (errorMessage.includes('403')) {
        userMessage = 'Permission denied. Please check your authentication.';
      } else if (errorMessage.includes('500')) {
        userMessage = 'Server error. Check the Express server logs for details.';
      }
      
      alert(`Error saving: ${userMessage}`);
    } finally {
      setIsSaving(false);
    }
  }

  // Generate new image with Gemini API
  async function generateWithGemini() {
    if (!selectedPhoto) {
      console.error('[GEMINI] No selected photo');
      return;
    }

    // Validate user input
    const inputValidation = validateUserInput(color, style);
    if (!inputValidation.isValid) {
      setGeminiError(inputValidation.message || 'Invalid input');
      alert(inputValidation.message);
      return;
    }

    setGeminiError(null);
    setIsGenerating(true);

    try {
      console.log('🎨 [GEMINI] Starting generation...');
      
      // Build prompt with Vision context
      const prompt = buildHairModificationPrompt(
        color,
        style,
        visionValidation
      );
      
      console.log('📝 [GEMINI] Prompt:', prompt);

      // Create AbortController with 5 minute timeout for Gemini API (image generation can take long)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes
      
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: selectedPhoto,
          prompt: prompt,
          hairColor: color,
          hairStyle: style,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gemini API error');
      }

      const data = await res.json();
      console.log('✅ [GEMINI] Response:', data);

      if (data.imageUrl) {
        setSelectedPhoto(data.imageUrl);
        console.log('🖼️ [GEMINI] Generated image set');
      } else {
        setGeminiError(data.message || 'No image was generated');
      }
    } catch (err) {
      console.error('❌ [GEMINI] Error:', err);
      if (err instanceof Error && err.name === 'AbortError') {
        setGeminiError('Image generation timed out after 5 minutes. Please try again - this can happen with complex transformations.');
      } else {
        setGeminiError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setIsGenerating(false);
    }
  }

  // Memoize image display to prevent re-renders on every keystroke
  const imageDisplay = useMemo(() => {
    if (!selectedPhoto) {
      return <span className="text-gray-600 text-sm">Image</span>;
    }
    
    return (
      <>
        <img
          src={selectedPhoto}
          alt="Selected from Google Photos"
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
        />
        {isVisionLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-3"></div>
            <span className="text-white text-sm font-medium">Processing image...</span>
          </div>
        )}
      </>
    );
  }, [selectedPhoto, isVisionLoading]);

  return (
    <div className="min-h-screen flex flex-row bg-gradient-to-br from-gray-50 via-white to-primary/5">
      <div className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-1">✨ Style Inspiration</h2>
          <p className="text-sm text-gray-600">Get ideas for your transformation</p>
        </div>

        <div className="flex-1 p-4 space-y-4">
          {/* Popular Hair Colors */}
          <div>
            <button 
              onClick={() => setShowColors(!showColors)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
            >
              <span className="font-semibold text-gray-900">Popular Hair Colors</span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${showColors ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showColors && (
              <div className="mt-2 space-y-1 animate-slide-down">
                <div className="grid grid-cols-2 gap-2 p-2">
                  {hairColors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => setColor(color)}
                      className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-primary hover:text-white hover:border-primary transition-colors text-left"
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Trending Hairstyles */}
          <div>
            <button
              onClick={() => setShowHairstyles(!showHairstyles)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
            >
              <span className="font-semibold text-gray-900">Trending Hairstyles</span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${showHairstyles ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showHairstyles && (
              <div className="mt-2 space-y-1 animate-slide-down">
                <div className="grid grid-cols-2 gap-2 p-2">
                  {trendingHairstyles.map((style, index) => (
                    <button
                      key={index}
                      onClick={() => setStyle(style)}
                      className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-primary hover:text-white hover:border-primary transition-colors text-left"
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">
            Experiment and Get Creative
          </h1>
          <p className="text-lg text-gray-600">
            Transform your look with AI-powered style changes
          </p>
        </div>

        {/* Vision Results and Comparison Container */}
        {isApplied && <div className="px-3 py-3 ">
          <div className="grid md:grid-cols-2">
            {/* Vision Results */}
            <div>
              <VisionResults
                isOpen={showVisionPanel}
                onClose={() => setShowVisionPanel(false)}
                isLoading={isVisionLoading}
                error={visionError}
                labels={visionData?.labels}
                raw={visionData?.visionResponse}
                validation={visionValidation}
              />
            </div>

            {/* Side-by-Side Comparison - Only show when transformation is applied */}
            {originalPhotoUrl && selectedPhoto && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  Before & After
                </h3>
                <div className="flex flex-row gap-2 bg-gray-50 rounded-lg p-2">
                  {/* Original Photo */}
                  <div className="flex-1 relative">
                    <div className="aspect-square bg-white rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
                      <img
                        src={originalPhotoUrl}
                        alt="Original photo"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center text-gray-400 text-xs p-2 text-center">
                                Original unavailable
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded text-center font-medium">
                      Before
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-0.5 bg-gray-300 my-2"></div>

                  {/* Transformed Photo */}
                  <div className="flex-1 relative">
                    <div className="aspect-square bg-white rounded-lg overflow-hidden border-2 border-primary shadow-sm">
                      <img
                        src={selectedPhoto}
                        alt="Transformed photo"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center text-gray-400 text-xs p-2 text-center">
                                Transformed unavailable
                              </div>
                            `;
                          }
                        }}
                      />
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 bg-primary bg-opacity-90 text-white text-xs px-2 py-1 rounded text-center font-medium">
                      After
                    </div>
                  </div>
                </div>

                {/* Transformation Details */}
                {(color || style) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex flex-wrap gap-3 text-sm">
                      {color && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                          <span className="font-medium">Color: {color}</span>
                        </div>
                      )}
                      {style && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/10 text-secondary rounded-lg">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                          </svg>
                          <span className="font-medium">Style: {style}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>}

        {/* Action Buttons */}
        {isApplied && <div className="mt-2 mb-2 flex items-center justify-center gap-4">
              <button 
                className="px-6 py-3 bg-white border border-red-300 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-colors flex items-center gap-2"
                onClick={() => {
                  setSelectedPhoto(null);
                  setOriginalPhotoUrl(null);
                  setGeminiError(null);
                  setIsApplied(false);
                  setSaveError(null);
                }}
              >
                <img
                  src="/images/trashcan.png"
                  alt="Trashcan"
                  className="w-5 h-5 object-contain"
                />
                <span>Clear</span>
              </button>

              <button
                disabled={!isApplied || isDownloading}
                onClick={downloadSelectedPhoto}
                className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  isApplied
                    ? isDownloading
                      ? "bg-gray-200 text-gray-700 cursor-wait"
                      : "bg-secondary hover:bg-secondary-dark text-white shadow-md hover:shadow-lg"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isDownloading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download</span>
                  </>
                )}
              </button>

              <button
                disabled={!isApplied || !originalPhotoUrl || isSaving}
                onClick={saveToDatabase}
                className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  isApplied && originalPhotoUrl
                    ? isSaving
                      ? "bg-gray-200 text-gray-700 cursor-wait"
                      : "bg-primary hover:bg-primary-dark text-white shadow-md hover:shadow-lg"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save to Gallery</span>
                  </>
                )}
              </button>
            </div>}

        {/* Main Content */}
        <div className="flex-1 p-3">
          <div className="max-w-6xl mx-auto">
            {/* Image and Form Container */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="grid md:grid-cols-2 p-8 gap-8 relative">
                {/* Left Side - Image */}
                <div className="flex flex-col items-center md:border-r md:border-gray-200 md:pr-8">
                  <div className="w-full max-w-md aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative border border-gray-200">
                    {imageDisplay}
                  </div>

                  <button
                    onClick={() => setShowPhotoPicker(true)}
                    className="w-full max-w-md px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Import Photos
                  </button>

                  <p className="mt-2 text-sm text-gray-600 text-center max-w-md">
                    This represents your current look. Customize the options on the right to see changes.
                  </p>
                </div>

                {/* Right Side - Form */}
                <div className="flex flex-col justify-center md:pl-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    What would you like to customize?
                  </h2>

                  <div className="space-y-6">
                    {/* Hair color input */}
                    <label className="block">
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src="/images/color_wheel.png"
                          alt="Color Wheel"
                          className="w-6 h-6 object-contain"
                        />
                        <span className="text-sm font-medium text-gray-700">Hair Color</span>
                      </div>
                      <input
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="e.g. Pink, Blonde, Blue"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                      />
                    </label>

                    {/* Hairstyle input */}
                    <label className="block">
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src="/images/comb_and_scissors.png"
                          alt="Comb and Scissors"
                          className="w-6 h-6 object-contain"
                        />
                        <span className="text-sm font-medium text-gray-700">Hairstyle</span>
                      </div>
                      <input
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        placeholder="e.g. Mohawk, No beard, Bob Cut"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-gray-900 placeholder-gray-400"
                      />
                    </label>

                    {/* Apply Button */}
                    <button
                      onClick={() => {
                        generateWithGemini();
                        setIsApplied(true);
                      }}
                      disabled={isVisionLoading || !selectedPhoto || (visionValidation?.isValid === false) || isGenerating}
                      className={`w-full px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                        isVisionLoading || !selectedPhoto || (visionValidation?.isValid === false) || isGenerating
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-primary hover:bg-primary-dark text-white shadow-md hover:shadow-lg transform hover:scale-105"
                      }`}
                      title={visionValidation?.isValid === false ? visionValidation.errorMessage : ''}
                    >
                      {isVisionLoading ? "Analyzing image..." : isGenerating ? "Generating..." : "Apply Transformation"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            

            
          </div>
        </div>
      </div>

      {/* Google Photos Picker Modal */}
      <GooglePhotosPicker
        isOpen={showPhotoPicker}
        onClose={() => setShowPhotoPicker(false)}
        onSelectPhoto={handlePhotoSelect}
      />
    </div>
  );
}