"use client";


import { useState } from "react";
import "@fontsource/lexend";


export default function GalleryPage() {


 const [dropdownOpen, setDropdownOpen] = useState(false);


 const scrollToTop = () => {
 window.scrollTo({ top: 0, behavior: "smooth" });
};


 // Example placeholders for Original and Styled photos
 const originalPhotos = Array.from({ length: 72 }, (_, i) => `Original ${i + 1}`);
 const styledPhotos = Array.from({ length: 72 }, (_, i) => `Styled ${i + 1}`);


 const [currentPage, setCurrentPage] = useState(1);
 const photosPerPage = 24;
 const totalPages = Math.ceil(originalPhotos.length / photosPerPage);


 // Calculate which photos to display for current page
 const startIndex = (currentPage - 1) * photosPerPage;
 const endIndex = startIndex + photosPerPage;


 return (
   <div
     className="min-h-screen flex flex-col items-center pt-15 pb-20 text-black bg-[#8df6ddff]"


     style={{ fontFamily: "'Lexend', sans-serif",
       backgroundColor: "#8df6ddff", // base color stays
       backgroundImage:
         "radial-gradient(#fef5fe 2px, transparent 2px), radial-gradient(#fef5fe 2px, transparent 2px)", // white dots
       backgroundSize: "80px 80px",
       backgroundPosition: "0 0, 40px 40px",
       backgroundBlendMode: "overlay", // makes sure base color shows through
     }}
   >


     <p className="text-[1.5rem]">Your Style Adventure Awaits</p>
     <p className="text-lg mt-5 text-black text-center">
       Select a Photo and Get Started.
     </p>


     {/* Buttons side by side */}
     <div className="mt-4 flex flex-row justify-center items-center gap-100 flex-nowrap">


       {/* Original Photos Button */}
       <div
         className="mt-4 flex items-center justify-center gap-6 bg-[#152f40ff] text-white rounded-2xl px-6 py-4 shadow-md cursor-pointer hover:shadow-lg transition-all duration-200 border-1 border-white min-w-[250px]"
       >
         <img
             src="/images/original_photos.png"
             alt="Original Photos"
             className="w-12 h-12 rounded-md"
           />
         <span className="text-[20px] whitespace-nowrap">Original Photos</span>
       </div>


       {/* Styled Photos Button */}
       <div
         className="mt-4 flex items-center justify-center gap-6 bg-[#152f40ff] text-white rounded-2xl px-8 py-4 shadow-md cursor-pointer hover:shadow-lg transition-all duration-200 border-1 border-white min-w-[230px]"
       >
         <img
             src="/images/styled_photos.png"
             alt="Styled Photos"
             className="w-12 h-12 rounded-md"
           />
         <span className="text-[20px] whitespace-nowrap">Styled Photos</span>
       </div>
     </div>


     {/* Sort with dropdown */}
     <div className="w-full max-w-7xl px-1 relative mt-3">
       <button
         onClick={() => setDropdownOpen(!dropdownOpen)}
         className="flex items-center gap-1 text-lg cursor-pointer px-4 py-2 bg-[#00000000] rounded shadow hover:bg-[#b7fff9ff]"
       >
         <span>Sort</span>
         <span className="ml-1">↑↓</span>


       </button>


       {dropdownOpen && (
         <div className="absolute mt-2 bg-[#b7fff9ff] border-1 border-[#a9ede7] shadow-md w-40">
           <div
             className="px-4 py-2 hover:bg-white cursor-pointer text-[15px] border-b border-[#a9ede7]"
             onClick={() => {
               console.log("Newest First clicked");
               setDropdownOpen(false);
             }}
           >
             Newest First
           </div>
           <div
             className="px-4 py-2 hover:bg-white cursor-pointer text-[15px]"
             onClick={() => {
               console.log("Oldest First clicked");
               setDropdownOpen(false);
             }}
           >
             Oldest First
           </div>
         </div>
       )}
     </div>


     {/* Two galleries side by side */}
     <div className="mt-6 flex flex-col sm:flex-row gap-6 w-full max-w-7xl px-4">
       {/* Original Photos */}
       <div className="flex-1 pr-6">
         <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 gap-10">
           {originalPhotos
             .slice((currentPage - 1) * 24, currentPage * 24)
             .map((photo, i) => (
               <div
                 key={i}
                 className="w-full h-50 bg-white rounded-md flex items-center justify-center text-gray-400"
               >
                 {photo}
               </div>
             ))}
         </div>
       </div>


       {/* Vertical Line */}
       <div className="w-px bg-black self-stretch"></div>


       {/* Styled Photos */}
       <div className="flex-1 pl-6">
         <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 gap-10">
           {styledPhotos
             .slice((currentPage - 1) * 24, currentPage * 24)
             .map((photo, i) => (
               <div
                 key={i}
                 className="w-full h-50 bg-white rounded-md flex items-center justify-center text-gray-400"
               >
                 {photo}
               </div>
             ))}
         </div>
       </div>
     </div>


     {/* Pagination Controls */}
     <div className="fixed bottom-0 left-0 w-full bg-[#8df6ddff] py-3 flex items-center justify-center gap-1 text-lg font-medium shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
       {/* Previous Page */}
       <button
         onClick={() => {
           if (currentPage > 1) {
             setCurrentPage(currentPage - 1);
             setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
           }
         }}
         disabled={currentPage === 1}
         className={`px-3 py-1 rounded ${
           currentPage === 1
             ? "text-gray-400 cursor-not-allowed"
             : "hover:bg-[#b7fff9ff]"
         }`}
       >
         &lt;
       </button>


       <span>Page {currentPage}</span>


       {/* Next Page */}
       <button
         onClick={() => {
           if (currentPage < totalPages) {
             setCurrentPage(currentPage + 1);
             setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
           }
         }}
         disabled={currentPage === totalPages}
         className={`px-3 py-1 rounded ${
           currentPage === totalPages
             ? "text-gray-400 cursor-not-allowed"
             : "hover:bg-[#b7fff9ff]"
         }`}
       >
         &gt;
       </button>
     </div>




   </div>
 );
}
