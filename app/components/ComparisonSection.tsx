"use client";
import React, { useEffect, useRef, useState } from "react";
import ImageComp from "@/app/components/ImageComp";


export default function ComparisonSection() {
 const sliderRef = useRef<any>(null);
 const [sliderValue, setSliderValue] = useState(50);


 // Decide if we are "before" or "after" for image switching
 const isBefore = sliderValue > 50;


 useEffect(() => {
 const interval = setInterval(() => {
   if (!sliderRef.current) return;
   const sliderEl = sliderRef.current.querySelector("img-comparison-slider") as any;
   if (!sliderEl || sliderEl.value === undefined) return;


   const val = Number(sliderEl.value);
   if (isNaN(val)) return;


   setSliderValue(100 - val);
 }, 50);
 return () => clearInterval(interval);
}, []);




 return (
   <div className="flex items-center justify-center gap-8 lg:gap-12 relative">
 {/* Before Text */}
 <div
   className="text-center lg:text-right transition-transform duration-200"
   style={{
     transform: `translateX(${-45 + sliderValue / 2}%)`,
     opacity: 1 - sliderValue / 100,
     paddingLeft: "4.5rem", // <-- space between text and image
   }}
 >
   <h2 className="text-3xl font-bold text-gray-900 mb-2">Before</h2>
   <p className="text-gray-600">Your original look</p>
 </div>


 {/* Image */}
 <div className="flex-shrink-0" ref={sliderRef}>
   <ImageComp
     firstSrc="/images/before-homepage.png"
     secondSrc="/images/after-homepage.png"
     width={500}
   />
 </div>


 {/* After Text */}
 <div
   className="text-center lg:text-left transition-transform duration-200"
   style={{
     transform: `translateX(${(sliderValue - 50) / 2 + 18}%)`,
     opacity: sliderValue / 100,
   }}
 >
   <h2 className="text-3xl font-bold text-gray-900 mb-2">After</h2>
   <p className="text-gray-600">AI-powered transformation</p>
 </div>
</div>


 );
}
