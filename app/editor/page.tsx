"use client";
import { useState, useEffect } from "react";
import GooglePhotosPicker from "../components/GooglePhotosPickerNew";
import VisionResults from "../components/VisionResults";
import { downloadUrlAsFile } from "../utils/download";
import { validateVisionData, extractHairFeatures, assessImageQuality } from "../utils/visionValidation";
import type { VisionValidationResult } from "../utils/visionValidation";
import { buildHairModificationPrompt, validateUserInput } from "../utils/geminiPrompt";

export default function EditorPage() {
  const [color, setColor] = useState("");
  const [style, setStyle] = useState("");

  const [showColors, setShowColors] = useState(false); // 👈 controls list visibility
  const [showHairstyles, setShowHairstyles] = useState(false);

  const [isApplied, setIsApplied] = useState(false);
  
  // Download state
  const [isDownloading, setIsDownloading] = useState(false);

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
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
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
      const res = await fetch('/api/photos/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: photoUrl }),
      });

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
      
      // Extract hair features for future use
      const hairFeatures = extractHairFeatures(data.visionResponse);
      if (hairFeatures.length > 0) {
        console.log('💇 [VISION] Detected hair features:', hairFeatures);
      }
      
      // Assess image quality
      const quality = assessImageQuality(data.visionResponse);
      if (!quality.isGoodQuality) {
        console.warn('📸 [QUALITY] Suggestions:', quality.suggestions);
      }
      
      setShowVisionPanel(true); // Auto-open panel on successful analysis
    } catch (err) {
      console.error('❌ [VISION] Error', err);
      setVisionError(err instanceof Error ? err.message : String(err));
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

  // Generate new image with Gemini API
  async function generateWithGemini() {
    if (!selectedPhoto) {
      console.error('❌ [GEMINI] No selected photo');
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
    setGeneratedImage(null);

    try {
      console.log('🎨 [GEMINI] Starting generation...');
      
      // Build prompt with Vision context
      const prompt = buildHairModificationPrompt(
        color,
        style,
        visionValidation
      );
      
      console.log('📝 [GEMINI] Prompt:', prompt);

      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: selectedPhoto,
          prompt: prompt,
          hairColor: color,
          hairStyle: style,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gemini API error');
      }

      const data = await res.json();
      console.log('✅ [GEMINI] Response:', data);

      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        console.log('🖼️ [GEMINI] Generated image set');
      } else {
        setGeminiError(data.message || 'No image was generated');
      }
    } catch (err) {
      console.error('❌ [GEMINI] Error:', err);
      setGeminiError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div
      className={"min-h-screen flex flex-row text-black bg-[#8df6ddff] " +
        "font-['Lexend',sans-serif] " +
        "bg-[radial-gradient(#fef5fe_2px,transparent_2px),radial-gradient(#fef5fe_2px,transparent_2px)] " +
        "bg-size-[80px_80px] bg-position-[0_0,40px_40px] bg-blend-overlay"}
    >
      {/* LEFT SIDEBAR */}
      <div
        className="w-[220px] bg-[#152f40ff] shadow-md border-r border-white flex flex-col items-center py-5 h-screen overflow-y-auto font-['Comfortaa',sans-serif]"
      >
        <h1 className="text-white text-lg font-medium text-[20px] mb-5">✨ Style Inspiration</h1>

        <div className="flex flex-col space-y-0 text-white font-medium text-[18px]">
          {/* Popular Hair Colors */}
          <button 
            onClick={() => setShowColors(!showColors)}
            className="border border-white px-4 py-2"
          >
            Popular Hair Colors
          </button>

          {/* Conditional list */}
            {showColors && (
              <ul className="list-disc text-white text-sm mt-5 mb-5 ml-10 space-y-1 text-left text-[18px]">
                {/* First group */}
                {hairColors.slice(0, 5).map((color, index) => (
                  <li key={index}>{color}</li>
                ))}

                {/* Gap before second group */}
                <div className="mt-6"></div>

                {/* Second group */}
                {hairColors.slice(5).map((color, index) => (
                  <li key={index + 5}>{color}</li>
                ))}
              </ul>
            )}

          {/* Trending Hairstyles */}
          <button
            onClick={() => setShowHairstyles(!showHairstyles)}
            className="border border-white px-4 py-2"
          >
            Trending Hairstyles
          </button>

          {/* Conditional list */}
            {showHairstyles && (
              <ul className="list-disc text-white text-sm mt-5 mb-5 ml-10 space-y-1 text-left text-[18px]">
                {/* First group */}
                {trendingHairstyles.slice(0, 9).map((style, index) => (
                  <li key={index}>{style}</li>
                ))}

                {/* Gap before second group */}
                <div className="mt-6"></div>

                {/* Second group */}
                {trendingHairstyles.slice(9).map((style, index) => (
                  <li key={index + 9}>{style}</li>
                ))}
              </ul>
            )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-col items-center flex-1 pt-[15px]">
        <p className="text-[40px]">Experiment and Get Creative</p>

        {/* White Rectangle Container */}
        <div className="bg-white rounded-sm shadow-lg w-[910px] h-[470px] flex overflow-hidden border border-gray-200 mt-10">
          {/* Left Side */}
          <div className="w-1/2 flex flex-col items-center justify-start p-6 mt-4">
            {/* Image placeholder */}
            <div className="w-[310px] h-[310px] bg-gray-300 rounded-md mb-4 flex items-center justify-center overflow-hidden relative">
              {selectedPhoto ? (
                <>
                  {console.log('🖼️ [RENDER] Rendering image with URL:', selectedPhoto)}
                  <img
                    src={selectedPhoto}
                    alt="Selected from Google Photos"
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                    onLoad={() => console.log('✅ [IMAGE] Image loaded successfully:', selectedPhoto)}
                    onError={(e) => {
                      console.error('❌ [IMAGE] Image failed to load');
                      console.error('❌ [IMAGE] Image URL was:', selectedPhoto);
                      console.error('❌ [IMAGE] Error event:', e);
                    }}
                  />
                  {/* Loading overlay during Vision API analysis */}
                  {isVisionLoading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-3"></div>
                      <span className="text-white text-sm font-medium">Processing image...</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {console.log('🖼️ [RENDER] No photo selected, showing placeholder')}
                  <span className="text-gray-600 text-sm">Image</span>
                </>
              )}
            </div>

            {/* Import from Google button (immediately below the Image window) */}
            <button
              onClick={() => setShowPhotoPicker(true)}
              className="mt-2 px-4 py-2 bg-[#b7fff9ff] text-black border border-black rounded-sm w-[285px] text-lg"
            >
              Import Photos
            </button>

            {/* Description */}
            <p className="w-[285px] text-sm text-black text-center">
              This represents your current look. Customize the options on the right to see changes.
            </p>
          </div>

         {/* Divider */}
          <div className="mt-10 mb-10 w-px bg-black"></div>

        {/* Right Side */}
          <div className="w-1/2 flex flex-col justify-center items-center p-6 space-y-4">
            <h2 className="text-[25px] font-medium text-black text-center">
              What would you like to customize?
            </h2>

            <div className="w-[90%] space-y-4">
              {/* Hair color input with image */}
              <label className="flex flex-col items-start">
                <span className="mt-3 text-[16px] text-[#434343] ml-[89px] mb-1">Hair color</span>
                <div className="flex items-center justify-center space-x-7">
                  <img
                    src="/images/color_wheel.png"
                    alt="Color Wheel"
                    className="w-12 h-12 object-contain"
                  />
                  <input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g. Pink"
                    className="w-80 flex-1 px-3 py-2 text-[18px] bg-[#b7fff9ff] border border-black rounded focus:outline-none"
                  />
                </div>
              </label>


              {/* Hairstyle input with image */}
              <label className="flex flex-col items-start">
                <span className="mt-3 text-[16px] text-[#434343] ml-[89px] mb-1">Hairstyle</span>
                <div className="flex items-center justify-center space-x-7">
                  <img
                    src="/images/comb_and_scissors.png"
                    alt="Comb and Scissors"
                    className="w-12 h-12 object-contain"
                  />
                  <input
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    placeholder="e.g. Mohawk, No beard"
                    className="w-80 flex-1 px-3 py-2 text-[18px] bg-[#b7fff9ff] border border-black rounded focus:outline-none"
                  />
                </div>
              </label>

              <div className="flex justify-center mt-4">
                <button
                  onClick={() => {
                    generateWithGemini();
                    setIsApplied(true);
                  }}
                  disabled={isVisionLoading || !selectedPhoto || (visionValidation?.isValid === false) || isGenerating}
                  className={`mt-4 px-5 py-2 border border-black rounded-sm transition ${
                    isVisionLoading || !selectedPhoto || (visionValidation?.isValid === false) || isGenerating
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#b7fff9ff] text-black hover:bg-[#a0ede7]"
                  }`}
                  title={visionValidation?.isValid === false ? visionValidation.errorMessage : ''}
                >
                  {isVisionLoading ? "Analyzing image..." : isGenerating ? "Generating..." : "Apply"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons BELOW the white rectangle */}
        <div className="mt-12 flex space-x-15">
          {/* Delete button */}
          <button 
            className="px-4 py-2 space-x-3 bg-transparent text-black rounded-full hover:bg-red-600 flex items-center border border-black text-[18px]"
            onClick={() => {
              setSelectedPhoto(null);
              setGeneratedImage(null);
              setGeminiError(null);
            }}
          >
            <img
              src="/images/trashcan.png"
              alt="Trashcan"
              className="w-6 h-6 object-contain"
            />
            <span>Delete</span>
          </button>

          {/* Save the NewMe button */}
          <button
            disabled={!isApplied || isDownloading}
            onClick={downloadSelectedPhoto}
            className={`px-4 py-2 rounded-full border border-black text-[18px] flex items-center justify-center transition ${
              isApplied
                ? isDownloading
                  ? "bg-gray-200 text-gray-700 cursor-wait"
                  : "bg-transparent text-black"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isDownloading ? 'Saving...' : 'Save the NewMe'}
          </button>
        </div>

        {/* Generated Image and Vision Results Container */}
        <div className="mt-8 flex space-x-4 items-start">
          {/* Generated Image Display */}
          {(generatedImage || isGenerating || geminiError) && (
            <div className="w-[310px] bg-white rounded-md shadow-md p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium">Generated Result</h3>
                <button
                  onClick={() => {
                    setGeneratedImage(null);
                    setGeminiError(null);
                  }}
                  className="px-2 py-1 text-sm border rounded bg-red-100"
                >
                  Clear
                </button>
              </div>

              {isGenerating && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
                  <span className="text-sm text-gray-600">Generating your new look...</span>
                </div>
              )}

              {geminiError && !isGenerating && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  {geminiError}
                </div>
              )}

              {generatedImage && !isGenerating && (
                <div className="space-y-3">
                  <img
                    src={generatedImage}
                    alt="Generated hairstyle"
                    className="w-full rounded border border-gray-200"
                  />
                  <div className="text-xs text-gray-500 text-center">
                    Your new look with {color || 'custom'} {style || 'hairstyle'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Vision results panel */}
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