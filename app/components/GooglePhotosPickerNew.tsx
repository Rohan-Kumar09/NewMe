"use client";
import { useState, useEffect, useRef } from "react";

interface GooglePhotosPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: (photoUrl: string, photoData: any) => void;
}

export default function GooglePhotosPicker({
  isOpen,
  onClose,
  onSelectPhoto,
}: GooglePhotosPickerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerWindow, setPickerWindow] = useState<Window | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const shouldPollRef = useRef(false);

  // Reset picker window state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      // Stop polling
      shouldPollRef.current = false;
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      setPickerWindow(null);
      setLoading(false);
      setError(null);
    }
  }, [isOpen]);

  // Open picker when modal opens
  useEffect(() => {
    if (isOpen && !loading && !error && !pickerWindow) {
      openPicker();
    }
  }, [isOpen]); // Only depend on isOpen to prevent double calls

  async function openPicker() {
    console.log('🚀 [PICKER] Starting openPicker()');
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create a picker session
      console.log('📝 [PICKER] Creating picker session...');
      const sessionRes = await fetch('/api/photos/create-session', {
        method: 'POST',
      });

      console.log('📝 [PICKER] Session response status:', sessionRes.status);

      if (!sessionRes.ok) {
        const errorData = await sessionRes.json();
        console.error('❌ [PICKER] Session creation failed:', errorData);
        throw new Error(errorData.error || 'Failed to create picker session');
      }

      const { sessionId, pickerUri } = await sessionRes.json();
      console.log('✅ [PICKER] Session created - ID:', sessionId);

      // Step 2: Open the picker URI in a popup window
      console.log('🪟 [PICKER] Opening popup window...');
      const width = 600;
      const height = 800;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      
      // Don't use /autoclose - we'll close it manually after getting the data
      const popup = window.open(
        pickerUri,
        'Google Photos Picker',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      if (!popup) {
        console.error('❌ [PICKER] Popup was blocked');
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      console.log('✅ [PICKER] Popup opened successfully');
      setPickerWindow(popup);
      setLoading(false);

      // Step 3: Poll the session to check when user finishes selection
      console.log('⏱️ [PICKER] Starting to poll session...');
      pollSession(sessionId, popup);
    } catch (err) {
      console.error('❌ [PICKER] Error opening picker:', err);
      setError(err instanceof Error ? err.message : 'Failed to open picker');
      setLoading(false);
    }
  }

  async function pollSession(sessionId: string, popup: Window) {
    console.log('🔄 [POLLING] Starting pollSession with ID:', sessionId);
    shouldPollRef.current = true;
    const pollInterval = 2000; // 2 seconds
    const maxAttempts = 150; // 5 minutes total
    let attempts = 0;

    const poll = async () => {
      // Check if polling should continue
      if (!shouldPollRef.current) {
        console.log('🛑 [POLLING] Stopped by cleanup');
        return;
      }

      attempts++;
      console.log(`🔄 [POLLING] Attempt ${attempts}/${maxAttempts}`);

      if (attempts > maxAttempts) {
        console.error('⏰ [POLLING] Timeout - max attempts reached');
        shouldPollRef.current = false;
        setError('Selection timed out');
        if (!popup.closed) popup.close();
        setPickerWindow(null);
        onClose();
        return;
      }

      // Check if popup was closed (note: we continue polling to get the final result)
      if (popup.closed) {
        console.log('🪟 [POLLING] Popup is closed, checking for final results...');
      }

      try {
        console.log(`📡 [POLLING] Fetching session status...`);
        const pollRes = await fetch(`/api/photos/poll-session?sessionId=${sessionId}`);
        
        console.log('📡 [POLLING] Poll response status:', pollRes.status);
        
        if (!pollRes.ok) {
          console.error('❌ [POLLING] Poll request failed');
          throw new Error('Failed to poll session');
        }

        const sessionData = await pollRes.json();
        const { mediaItemsSet, pollingConfig, mediaItems } = sessionData;
        console.log('📡 [POLLING] mediaItemsSet:', mediaItemsSet);
        console.log('📡 [POLLING] mediaItems:', mediaItems);

        if (mediaItemsSet) {
          console.log('✅ [POLLING] User finished selecting!');
          shouldPollRef.current = false; // Stop polling
          
          if (mediaItems && mediaItems.length > 0) {
            console.log('📸 [MEDIA] Processing', mediaItems.length, 'media items');
            const firstItem = mediaItems[0];
            console.log('📸 [MEDIA] First item:', JSON.stringify(firstItem, null, 2));
            
            // PickedMediaItem has structure: { mediaFile: { baseUrl, mimeType, width, height } }
            const baseUrl = firstItem.mediaFile?.baseUrl || firstItem.baseUrl;
            console.log('📸 [MEDIA] Extracted baseUrl:', baseUrl);

            if (baseUrl) {
              const googlePhotoUrl = `${baseUrl}=w1000-h1000`;
              const photoUrl = `/api/photos/proxy-image?url=${encodeURIComponent(googlePhotoUrl)}`;
              console.log('📸 [MEDIA] Google Photos URL:', googlePhotoUrl);
              console.log('📸 [MEDIA] Proxied URL:', photoUrl);
              console.log('✅ [MEDIA] Calling onSelectPhoto callback...');
              onSelectPhoto(photoUrl, firstItem);
              console.log('✅ [MEDIA] Callback completed');
            } else {
              console.error('❌ [MEDIA] No baseUrl found in media item');
            }
          } else {
            console.warn('⚠️ [MEDIA] No media items in poll response, fetching separately...');
            
            // Fallback: fetch media items from separate endpoint
            try {
              const mediaRes = await fetch(`/api/photos/list-selected?sessionId=${sessionId}`);
              console.log('📸 [MEDIA] Separate fetch status:', mediaRes.status);
              
              if (mediaRes.ok) {
                const { mediaItems: fetchedItems } = await mediaRes.json();
                console.log('📸 [MEDIA] Fetched items:', fetchedItems);
                
                if (fetchedItems && fetchedItems.length > 0) {
                  const firstItem = fetchedItems[0];
                  console.log('📸 [MEDIA] First item:', JSON.stringify(firstItem, null, 2));
                  
                  // PickedMediaItem has structure: { mediaFile: { baseUrl, mimeType, width, height } }
                  const baseUrl = firstItem.mediaFile?.baseUrl || firstItem.baseUrl;
                  console.log('📸 [MEDIA] Extracted baseUrl:', baseUrl);

                  if (baseUrl) {
                    const googlePhotoUrl = `${baseUrl}=w512-h512`;
                    const photoUrl = `/api/photos/proxy-image?url=${encodeURIComponent(googlePhotoUrl)}`;
                    console.log('📸 [MEDIA] Google Photos URL:', googlePhotoUrl);
                    console.log('📸 [MEDIA] Proxied URL:', photoUrl);
                    console.log('✅ [MEDIA] Calling onSelectPhoto callback...');
                    onSelectPhoto(photoUrl, firstItem);
                    console.log('✅ [MEDIA] Callback completed');
                  } else {
                    console.error('❌ [MEDIA] No baseUrl found in media item');
                  }
                }
              } else {
                console.error('❌ [MEDIA] Failed to fetch media items');
              }
            } catch (fetchErr) {
              console.error('❌ [MEDIA] Error fetching media items:', fetchErr);
            }
          }

          console.log('🪟 [POLLING] Closing popup...');
          if (!popup.closed) popup.close();
          setPickerWindow(null);
          onClose();
          return;
        } else {
          // Continue polling only if flag is still true
          if (!shouldPollRef.current) {
            console.log('🛑 [POLLING] Stopped before next poll');
            return;
          }

          // If popup is closed but mediaItemsSet is false, give it a few more attempts
          // (the API might need a moment to process the selection)
          if (popup.closed && attempts > 5) {
            console.log('⚠️ [POLLING] Popup closed but no items selected after multiple attempts');
            shouldPollRef.current = false;
            setPickerWindow(null);
            setError('No photos were selected');
            onClose();
            return;
          }
          
          const nextPollInterval = pollingConfig?.pollInterval 
            ? parseInt(pollingConfig.pollInterval) * 1000 
            : pollInterval;
          console.log(`⏱️ [POLLING] Not ready yet, polling again in ${nextPollInterval}ms...`);
          pollIntervalRef.current = setTimeout(poll, nextPollInterval);
        }
      } catch (err) {
        console.error('❌ [POLLING] Polling error:', err);
        shouldPollRef.current = false;
        setError(err instanceof Error ? err.message : 'Error during photo selection');
        if (!popup.closed) popup.close();
        setPickerWindow(null);
        onClose();
      }
    };

    // Start polling
    const initialDelay = 3000; // 3 seconds initial delay
    console.log(`⏱️ [POLLING] Scheduling first poll in ${initialDelay}ms...`);
    pollIntervalRef.current = setTimeout(poll, initialDelay);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
        {loading && (
          <div className="text-center">
            <div className="text-xl text-gray-800 mb-4">Opening Google Photos...</div>
            <div className="text-sm text-gray-600">A popup window will open</div>
          </div>
        )}

        {error && (
          <div className="text-center">
            <div className="text-xl text-red-600 mb-4">{error}</div>
            <button
              onClick={() => {
                setError(null);
                openPicker();
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="text-center">
            <div className="text-xl text-gray-800 mb-4">Select your photos in the popup window</div>
            <div className="text-sm text-gray-600 mb-4">Close this window when you're done</div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
