"use client";

import { useState, useEffect, useRef } from "react";

export default function GalleryPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'original' | 'styled'>('original');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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

  // Example placeholders for Original and Styled photos
  const originalPhotos = Array.from({ length: 72 }, (_, i) => `Original ${i + 1}`);
  const styledPhotos = Array.from({ length: 72 }, (_, i) => `Styled ${i + 1}`);
  const [currentPage, setCurrentPage] = useState(1);
  const photosPerPage = 24;
  const totalPages = Math.ceil(originalPhotos.length / photosPerPage);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setTimeout(() => scrollToTop(), 100);
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
          <button
            onClick={() => setActiveTab('original')}
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

          <button
            onClick={() => setActiveTab('styled')}
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
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                onClick={() => {
                  console.log("Newest First clicked");
                  setDropdownOpen(false);
                }}
              >
                Newest First
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => {
                  console.log("Oldest First clicked");
                  setDropdownOpen(false);
                }}
              >
                Oldest First
              </button>
            </div>
          )}
        </div>

        {/* Photo Grid */}
        <div className="mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {(activeTab === 'original' ? originalPhotos : styledPhotos)
              .slice((currentPage - 1) * photosPerPage, currentPage * photosPerPage)
              .map((photo, i) => (
                <div
                  key={i}
                  className="aspect-square bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden group cursor-pointer"
                >
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm group-hover:bg-gray-50 transition-colors">
                    {photo}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Pagination */}
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
      </div>
    </div>
  );
}
