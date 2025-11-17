/**
 * Gemini Prompt Builder Utilities
 * Constructs focused prompts for image-to-image modification with Gemini API
 */

/**
 * Builds a focused prompt for Gemini API to modify only the hair in an image
 * @param hairColor - Desired hair color from user input
 * @param hairStyle - Desired hairstyle from user input
 * @param visionContext - Optional Vision API data for additional context
 * @returns Structured prompt string for Gemini
 */
export function buildHairModificationPrompt(
  hairColor: string,
  hairStyle: string,
  visionContext?: any
): string {
  const parts: string[] = [];

  // 1. Primary instruction
  parts.push('Modify ONLY the hair in this image.');
  parts.push('');

  // 2. User's desired changes
  if (hairColor && hairColor.trim()) {
    parts.push(`Change the hair color to: ${hairColor.trim()}`);
  }
  
  if (hairStyle && hairStyle.trim()) {
    parts.push(`Change the hairstyle to: ${hairStyle.trim()}`);
  }

  if (!hairColor.trim() && !hairStyle.trim()) {
    parts.push('Apply a creative hairstyle transformation.');
  }

  parts.push('');

  // 3. Preservation instructions (critical)
  parts.push('PRESERVE EXACTLY:');
  parts.push('- All facial features (eyes, nose, mouth, face shape)');
  parts.push('- Skin tone, makeup, and facial hair (unless specified to change)');
  parts.push('- Expression and emotion');
  parts.push('- Clothing, accessories, and jewelry');
  parts.push('- Background and environment');
  parts.push('- Lighting, shadows, and photo quality');
  parts.push('- Camera angle and composition');
  parts.push('- Body position and pose');
  parts.push('');

  // 4. Quality directives
  parts.push('REQUIREMENTS:');
  parts.push('- Generate a photorealistic result');
  parts.push('- Make the new hairstyle look natural and realistic');
  parts.push('- Match the original image quality and resolution');
  parts.push('- Ensure proper shadows and highlights on the new hair');
  parts.push('- The result should look like the same person with a new hairstyle');
  parts.push('- Do not add any text, watermarks, or logos');

  // 5. Optional: Add context from Vision API if available
  if (visionContext?.faceCount > 1) {
    parts.push('');
    parts.push(`Note: Multiple faces detected (${visionContext.faceCount}). Focus on the primary/central face.`);
  }

  return parts.join('\n');
}

/**
 * Validates user input before sending to Gemini
 * @param hairColor - User's hair color input
 * @param hairStyle - User's hairstyle input
 * @returns Validation result
 */
export function validateUserInput(hairColor: string, hairStyle: string): {
  isValid: boolean;
  message?: string;
} {
  const color = hairColor?.trim() || '';
  const style = hairStyle?.trim() || '';

  // At least one field should be filled
  if (!color && !style) {
    return {
      isValid: false,
      message: 'Please enter at least a hair color or hairstyle preference.',
    };
  }

  // Basic sanitization checks
  const combined = color + ' ' + style;
  const maxLength = 200;
  
  if (combined.length > maxLength) {
    return {
      isValid: false,
      message: `Input is too long. Please keep your preferences under ${maxLength} characters.`,
    };
  }

  return { isValid: true };
}
