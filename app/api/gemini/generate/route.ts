import { NextResponse } from 'next/server';

function parseCookies(cookieHeader: string | null) {
  const map: Record<string, string> = {};
  if (!cookieHeader) return map;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    map[key] = val;
  }
  return map;
}

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);
    const accessToken = cookies['access_token'];

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl, prompt, hairColor, hairStyle } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 });
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 });
    }

    console.log('🎨 [GEMINI] Starting image generation...');
    console.log('🎨 [GEMINI] Hair Color:', hairColor);
    console.log('🎨 [GEMINI] Hairstyle:', hairStyle);
    console.log('🎨 [GEMINI] Prompt length:', prompt.length);

    // Fetch the image to send to Gemini
    const origin = new URL(request.url).origin;
    const absoluteUrl = imageUrl.startsWith('http') ? imageUrl : `${origin}${imageUrl}`;

    const imageRes = await fetch(absoluteUrl, {
      method: 'GET',
      headers: {
        cookie: cookieHeader || '',
      },
    });

    if (!imageRes.ok) {
      const text = await imageRes.text();
      console.error('❌ [GEMINI] Image fetch failed:', imageRes.status, text);
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 });
    }

    const arrayBuf = await imageRes.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuf);
    const base64Image = imageBuffer.toString('base64');
    
    console.log('✅ [GEMINI] Image fetched, size:', imageBuffer.length, 'bytes');

    // Get Google API key from environment (Vertex AI via Google Cloud Console)
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.error('❌ [GEMINI] GOOGLE_API_KEY not configured');
      return NextResponse.json(
        { error: 'Google API Key not configured on server' },
        { status: 500 }
      );
    }

    // Use Gemini 2.5 Flash Image via Vertex AI - designed for rapid creative workflows with image generation
    // Supports conversational, multi-turn editing capabilities
    // Budget-friendly with image generation capabilities
    const model = 'gemini-2.5-flash-image';
    
    // Vertex AI endpoint using API key authentication
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    // Force image generation by adding explicit instruction
    const imageGenerationPrompt = `${prompt}\n\nIMPORTANT: You MUST generate and return the modified image. Do not ask questions or provide explanations without the image. Generate the image now.`;

    const geminiRequestBody = {
      contents: [
        {
          parts: [
            {
              text: imageGenerationPrompt,
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 1.0,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        candidateCount: 1,
        response_modalities: ['IMAGE'],
      },
    };

    console.log('📡 [GEMINI] Calling Gemini API...');
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiRequestBody),
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error('❌ [GEMINI] API call failed:', geminiRes.status, errorText);
      return NextResponse.json(
        { error: 'Gemini API call failed', details: errorText },
        { status: geminiRes.status }
      );
    }

    const geminiResponse = await geminiRes.json();
    console.log('✅ [GEMINI] Response received');

    // Extract generated content from Gemini 2.5 Flash Image
    const candidates = geminiResponse.candidates || [];
    if (candidates.length === 0) {
      console.error('❌ [GEMINI] No candidates in response');
      console.error('📦 [GEMINI] Response structure:', JSON.stringify(geminiResponse, null, 2));
      return NextResponse.json(
        { error: 'No response from Gemini', details: geminiResponse },
        { status: 500 }
      );
    }

    const content = candidates[0]?.content;
    const parts = content?.parts || [];
    
    console.log('📋 [GEMINI] Number of parts in response:', parts.length);
    
    // Check for image data in response
    let generatedImageData = null;
    let textResponse = '';
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      // Debug: Check what keys exist in this part
      const partKeys = Object.keys(part);
      console.log(`📦 Part ${i} keys:`, partKeys);
      
      if (part.inline_data) {
        console.log('📦 inline_data keys:', Object.keys(part.inline_data));
        const mimeType = part.inline_data.mime_type || part.inline_data.mimeType || 'image/png';
        generatedImageData = {
          data: part.inline_data.data,
          mimeType: mimeType
        };
        console.log('🎨 [GEMINI] Image found, mime:', mimeType);
      } else if (part.inlineData) {
        // Try alternate key name
        console.log('📦 inlineData keys:', Object.keys(part.inlineData));
        const mimeType = part.inlineData.mime_type || part.inlineData.mimeType || 'image/png';
        generatedImageData = {
          data: part.inlineData.data,
          mimeType: mimeType
        };
        console.log('🎨 [GEMINI] Image found (inlineData), mime:', mimeType);
      } else if (part.text) {
        textResponse += part.text;
      }
    }

    console.log('🎨 [GEMINI] Generation complete, has image:', !!generatedImageData);

    if (generatedImageData) {
      // Convert base64 image to data URL for frontend display
      const imageDataUrl = `data:${generatedImageData.mimeType};base64,${generatedImageData.data}`;
      
      return NextResponse.json({
        success: true,
        imageUrl: imageDataUrl,
        message: 'Image successfully generated with Gemini 2.5 Flash Image',
        model: model,
        debug: {
          promptLength: prompt.length,
          hasImage: true,
          imageSize: generatedImageData.data.length,
        },
      });
    } else {
      // Fallback if no image was generated
      console.warn('⚠️ [GEMINI] No image data in response');
      console.warn('📝 [GEMINI] Text response:', textResponse);
      console.warn('📦 [GEMINI] Full candidates:', JSON.stringify(candidates, null, 2));
      
      return NextResponse.json({
        success: false,
        imageUrl: null,
        message: 'No image was generated. Model returned text only.',
        geminiResponse: textResponse,
        fullResponse: geminiResponse,
        model: model,
        debug: {
          promptLength: prompt.length,
          responseLength: textResponse.length,
          partsCount: parts.length,
          textContent: textResponse,
        },
      });
    }

  } catch (e: any) {
    console.error('❌ [GEMINI] Error:', e?.message || e);
    return NextResponse.json(
      { error: String(e), message: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
