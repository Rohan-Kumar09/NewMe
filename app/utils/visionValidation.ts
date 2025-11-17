/**
 * Vision API Validation Utilities
 * Validates images before sending to Gemini API for generation
 */

export interface VisionValidationResult {
  isValid: boolean;
  hasDetectedFace: boolean;
  isSafeContent: boolean;
  faceCount: number;
  errorMessage?: string;
  warnings: string[];
}

/**
 * Validates Vision API response for face detection and content safety
 * @param visionResponse - The full Vision API response object
 * @returns Validation result with detailed feedback
 */
export function validateVisionData(visionResponse: any): VisionValidationResult {
  const result: VisionValidationResult = {
    isValid: true,
    hasDetectedFace: false,
    isSafeContent: true,
    faceCount: 0,
    warnings: [],
  };

  // 1. Face Detection Validation
  const faces = visionResponse?.faceAnnotations || [];
  result.faceCount = faces.length;
  result.hasDetectedFace = faces.length > 0;

  if (faces.length === 0) {
    result.isValid = false;
    result.errorMessage = 'No face detected in the image. Please use a photo with a clear, visible face.';
    return result;
  }

  if (faces.length > 1) {
    result.warnings.push(`Multiple faces detected (${faces.length}). The hairstyle will be applied to the primary face.`);
  }

  // Check face detection confidence
  const primaryFace = faces[0];
  if (primaryFace.detectionConfidence && primaryFace.detectionConfidence < 0.5) {
    result.warnings.push('Face detection confidence is low. Try using a clearer photo for better results.');
  }

  // 2. Safe Search Detection
  const safeSearch = visionResponse?.safeSearchAnnotation;
  if (safeSearch) {
    const likelihood = {
      VERY_UNLIKELY: 0,
      UNLIKELY: 1,
      POSSIBLE: 2,
      LIKELY: 3,
      VERY_LIKELY: 4,
    };

    const getLevel = (value: string) => likelihood[value as keyof typeof likelihood] ?? 0;

    // Check for explicit content
    if (getLevel(safeSearch.adult) >= 3 || getLevel(safeSearch.violence) >= 3) {
      result.isValid = false;
      result.isSafeContent = false;
      result.errorMessage = 'Image contains inappropriate content and cannot be processed.';
      return result;
    }

    // Check for other concerning content
    if (getLevel(safeSearch.racy) >= 4) {
      result.isValid = false;
      result.isSafeContent = false;
      result.errorMessage = 'Image may contain inappropriate content and cannot be processed.';
      return result;
    }

    // Warnings for borderline content
    if (getLevel(safeSearch.adult) === 2 || getLevel(safeSearch.racy) === 3) {
      result.warnings.push('Image may contain suggestive content. Please use appropriate photos.');
    }
  }

  // 3. Image Quality Checks (optional warnings)
  const imageProps = visionResponse?.imagePropertiesAnnotation;
  if (imageProps?.dominantColors?.colors) {
    const topColor = imageProps.dominantColors.colors[0];
    // If image is very dark (low RGB values and high coverage)
    if (topColor.color && topColor.pixelFraction > 0.5) {
      const brightness = (topColor.color.red + topColor.color.green + topColor.color.blue) / 3;
      if (brightness < 30) {
        result.warnings.push('Image appears very dark. Better lighting may improve results.');
      }
    }
  }

  return result;
}

/**
 * Extract current hair features from Vision API labels
 * @param visionResponse - The full Vision API response object
 * @returns Array of detected hair-related features
 */
export function extractHairFeatures(visionResponse: any): string[] {
  const labels = visionResponse?.labelAnnotations || [];
  
  const hairKeywords = [
    'hair', 'hairstyle', 'haircut', 'bangs', 'ponytail', 
    'braid', 'beard', 'mustache', 'long hair', 'short hair',
    'curly', 'straight', 'wavy'
  ];

  const hairLabels = labels
    .filter((l: any) => {
      const desc = l.description.toLowerCase();
      return hairKeywords.some(keyword => desc.includes(keyword));
    })
    .filter((l: any) => l.score > 0.7) // Only confident detections
    .map((l: any) => l.description)
    .slice(0, 5); // Top 5 features

  return hairLabels;
}

/**
 * Check if image quality is sufficient for processing
 * @param visionResponse - The full Vision API response object
 * @returns Quality assessment
 */
export function assessImageQuality(visionResponse: any): {
  isGoodQuality: boolean;
  suggestions: string[];
} {
  const suggestions: string[] = [];
  let isGoodQuality = true;

  const faces = visionResponse?.faceAnnotations || [];
  if (faces.length > 0) {
    const face = faces[0];

    // Check if face is too small (bounded box is tiny)
    if (face.boundingPoly?.vertices) {
      const vertices = face.boundingPoly.vertices;
      const width = Math.abs(vertices[1].x - vertices[0].x);
      const height = Math.abs(vertices[2].y - vertices[1].y);
      
      if (width < 100 || height < 100) {
        suggestions.push('Face appears small in the image. Try using a closer photo for better results.');
        isGoodQuality = false;
      }
    }

    // Check face angle (extreme angles may not work well)
    if (face.panAngle && Math.abs(face.panAngle) > 45) {
      suggestions.push('Face is turned significantly. Front-facing photos work best.');
    }

    if (face.tiltAngle && Math.abs(face.tiltAngle) > 30) {
      suggestions.push('Face is tilted significantly. Level photos work best.');
    }

    // Check for blur/underexposed
    if (face.underExposedLikelihood === 'VERY_LIKELY' || face.underExposedLikelihood === 'LIKELY') {
      suggestions.push('Image appears underexposed. Try a brighter photo.');
      isGoodQuality = false;
    }

    if (face.blurredLikelihood === 'VERY_LIKELY' || face.blurredLikelihood === 'LIKELY') {
      suggestions.push('Image appears blurry. Try a sharper photo.');
      isGoodQuality = false;
    }
  }

  return { isGoodQuality, suggestions };
}
