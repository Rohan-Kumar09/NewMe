"use client";

import { useState, useEffect, useRef } from "react";
import { getTransformations, deleteTransformation, type Transformation } from "../utils/saveTransformation";

export default function GalleryPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'original' | 'styled' | 'comparison'>('comparison');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Transformations data
  const [transformations, setTransformations] = useState<Transformation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDocId, setLastDocId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const photosPerPage = 24;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Fetch transformations from database
  const fetchTransformations = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 [GALLERY] Fetching transformations...');
      
      const response = await getTransformations(100); // Fetch up to 100 items
      console.log('✅ [GALLERY] Fetched transformations:', response);
      
      setTransformations(response.transformations);
      setHasMore(response.hasMore);
      setLastDocId(response.lastDocId);
    } catch (err) {
      console.error('❌ [GALLERY] Error fetching transformations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when tab changes
  useEffect(() => {
    fetchTransformations();
  }, []);

  // Get image URL - handle both proxied URLs and direct URLs
  const getImageUrl = (url: string | undefined): string => {
    if (!url) return '';
    
    // If it's already a proxied URL or absolute URL, use it directly
    if (url.startsWith('/api/photos/proxy-image') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If it's a Google Photos URL, proxy it
    if (url.includes('googleusercontent.com') || url.includes('photos.google.com')) {
      return `/api/photos/proxy-image?url=${encodeURIComponent(url)}`;
    }
    
    return url;
  };

  // Sort transformations
  const sortedTransformations = [...transformations].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  // Get photos for current tab
  const getPhotosForTab = () => {
    if (activeTab === 'comparison') {
      // For comparison tab, return both URLs
      return sortedTransformations.map((transformation) => ({
        id: transformation.id,
        originalUrl: getImageUrl(transformation.originalImageUrl),
        transformedUrl: getImageUrl(transformation.transformedImageUrl),
        url: getImageUrl(transformation.originalImageUrl), // Keep for compatibility
        hairColor: transformation.hairColor,
        hairStyle: transformation.hairStyle,
        createdAt: transformation.createdAt,
      })).filter(photo => photo.originalUrl && photo.transformedUrl); // Filter out incomplete pairs
    } else {
      // For original/styled tabs, return single URL
      return sortedTransformations.map((transformation) => ({
        id: transformation.id,
        url: activeTab === 'original' 
          ? getImageUrl(transformation.originalImageUrl)
          : getImageUrl(transformation.transformedImageUrl),
        hairColor: transformation.hairColor,
        hairStyle: transformation.hairStyle,
        createdAt: transformation.createdAt,
      })).filter(photo => photo.url); // Filter out photos without URLs
    }
  };

  const photos = getPhotosForTab();
  const totalPages = Math.ceil(photos.length / photosPerPage);
  const paginatedPhotos = photos.slice(
    (currentPage - 1) * photosPerPage,
    currentPage * photosPerPage
  );

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setTimeout(() => scrollToTop(), 100);
  };

  const handleSortChange = (order: 'newest' | 'oldest') => {
    setSortOrder(order);
    setDropdownOpen(false);
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      await deleteTransformation(id);
      // Remove from local state
      setTransformations(transformations.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error deleting transformation:', err);
      alert('Failed to delete photo. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Your Style Adventure Awaits
          </h1>
          <p className="text-lg text-gray-600">
            Browse your original and styled photos
          </p>
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-row justify-center items-center gap-4 mb-6">
          {/* Side by Side View */}
        <button
            onClick={() => {
              setActiveTab('comparison');
              setCurrentPage(1);
            }}
            className={`flex items-center justify-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'comparison'
                ? 'bg-primary text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <span>Side by Side</span>
          </button>
          {/* Original View */}
          <button
            onClick={() => {
              setActiveTab('original');
              setCurrentPage(1);
            }}
            className={`flex items-center justify-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'original'
                ? 'bg-primary text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <img
              src="/images/original_photos.png"
              alt="Original Photos"
              className="w-6 h-6 rounded-md"
            />
            <span>Original Photos</span>
          </button>

          {/* Styled View */}
          <button
            onClick={() => {
              setActiveTab('styled');
              setCurrentPage(1);
            }}
            className={`flex items-center justify-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              activeTab === 'styled'
                ? 'bg-primary text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <img
              src="/images/styled_photos.png"
              alt="Styled Photos"
              className="w-6 h-6 rounded-md"
            />
            <span>Styled Photos</span>
          </button>
          
        </div>

        {/* Sort Dropdown */}
        <div className="flex justify-end mb-6 relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span>Sort</span>
            <svg
              className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 animate-slide-down">
              <button
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                  sortOrder === 'newest' ? 'text-primary font-semibold' : 'text-gray-700'
                }`}
                onClick={() => handleSortChange('newest')}
              >
                Newest First
              </button>
              <button
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  sortOrder === 'oldest' ? 'text-primary font-semibold' : 'text-gray-700'
                }`}
                onClick={() => handleSortChange('oldest')}
              >
                Oldest First
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <span className="ml-3 text-gray-600">Loading photos...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-800 font-medium">Error loading photos</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={fetchTransformations}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && photos.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <svg
                className="mx-auto h-24 w-24 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No photos yet</h3>
              <p className="text-gray-600 mb-6">
                {activeTab === 'original'
                  ? "You haven't imported any photos from Google Photos yet."
                  : activeTab === 'styled'
                  ? "You haven't created any styled photos yet."
                  : "You haven't created any transformations yet."}
              </p>
              <a
                href="/editor"
                className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
              >
                Create Your First Transformation
              </a>
            </div>
          </div>
        )}

        {/* Photo Grid */}
        {!loading && !error && photos.length > 0 && (
          <div className="mb-8">
            {activeTab === 'comparison' ? (
              // Side-by-side comparison view
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {paginatedPhotos.map((photo: any) => (
                  <div
                    key={photo.id}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden group relative"
                  >
                    {/* Side-by-side container */}
                    <div className="flex flex-row">
                      {/* Original photo */}
                      <div className="flex-1 aspect-square relative">
                        <img
                          src={photo.originalUrl}
                          alt="Original photo"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center text-gray-400 text-xs p-2 text-center bg-gray-100">
                                  Original unavailable
                                </div>
                              `;
                            }
                          }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1 text-center">
                          Before
                        </div>
                      </div>
                      {/* Divider */}
                      <div className="w-0.5 bg-gray-300"></div>
                      {/* Transformed photo */}
                      <div className="flex-1 aspect-square relative">
                        <img
                          src={photo.transformedUrl}
                          alt="Styled photo"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center text-gray-400 text-xs p-2 text-center bg-gray-100">
                                  Styled unavailable
                                </div>
                              `;
                            }
                          }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1 text-center">
                          After
                        </div>
                      </div>
                    </div>
                    {/* Info overlay on hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="text-white text-sm text-center p-4">
                        {photo.hairColor && (
                          <div className="mb-1">
                            <span className="font-semibold">Color:</span> {photo.hairColor}
                          </div>
                        )}
                        {photo.hairStyle && (
                          <div className="mb-1">
                            <span className="font-semibold">Style:</span> {photo.hairStyle}
                          </div>
                        )}
                        {photo.createdAt && (
                          <div className="text-gray-300 text-xs mt-2">
                            {new Date(photo.createdAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                      title="Delete photo"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              // Single photo view (original or styled)
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {paginatedPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="aspect-square bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden group relative"
                  >
                    <img
                      src={photo.url}
                      alt={activeTab === 'original' ? 'Original photo' : 'Styled photo'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center text-gray-400 text-xs p-2 text-center">
                              Image unavailable
                            </div>
                          `;
                        }
                      }}
                    />
                    {/* Hover overlay with photo info */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-end opacity-0 group-hover:opacity-100">
                      <div className="w-full p-2 text-white text-xs">
                        {photo.hairColor && (
                          <div className="mb-1">
                            <span className="font-semibold">Color:</span> {photo.hairColor}
                          </div>
                        )}
                        {photo.hairStyle && (
                          <div className="mb-1">
                            <span className="font-semibold">Style:</span> {photo.hairStyle}
                          </div>
                        )}
                        {photo.createdAt && (
                          <div className="text-gray-300 text-xs">
                            {new Date(photo.createdAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      title="Delete photo"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && photos.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 pb-8">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-primary"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={i}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      currentPage === pageNum
                        ? "bg-primary text-white shadow-md"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                currentPage === totalPages
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-primary"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Refresh Button */}
        {!loading && (
          <div className="flex justify-center pb-8">
            <button
              onClick={fetchTransformations}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
