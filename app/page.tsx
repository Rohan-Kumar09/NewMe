"use client"; // <-- Add this at the very top

import { useState } from "react";
import "@fontsource/lexend";

export default function Home() {
  const [sliderPos, setSliderPos] = useState(50);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPos(Number(e.target.value));
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center pt-15 text-black bg-[#8df6ddff]"
      style={{ fontFamily: "'Lexend', sans-serif" }}
    >
      <p className="text-[1.5rem]">Discover the New You</p>
      <p className="text-lg mt-5 text-black text-center max-w-lg">
        The possibilities are endless — AI reinvents your style, no scissors required.
      </p>

      <div className="relative mt-10 w-80 h-80 md:w-[500px] md:h-[400px] rounded-lg overflow-hidden shadow-lg bg-[#152f40ff]">
        {/* AFTER IMAGE (bottom layer) */}
        <img
          src="/images/after-homepage.png"
          alt="After"
          className="absolute top-0 left-0 w-full h-full object-contain"
        />
        {/* BEFORE IMAGE (top layer) */}
        <img
          src="/images/before-homepage.png"
          alt="Before"
          className="absolute top-0 left-0 h-full object-contain"
          style={{ width: `${100 - sliderPos}%` }}
        />

        {/* Slider */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPos}
          onChange={handleSliderChange}
          className="absolute bottom-2 left-0 w-full appearance-none h-1 rounded-lg cursor-pointer"
          style={{
            background: "linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899)", // blue → purple → pink
          }}
        />

        {/* Custom slider thumb for Chrome */}
        <style jsx>{`
          input[type='range']::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 15px;
            width: 15px;
            background: white;
            border-radius: 0;
            cursor: pointer;
            margin-top: -7px; /* adjust to center on track */
            transform: rotate(45deg); /* diamond shape */
          }
        `}</style>
      </div>

      <div className="flex justify-between w-80 md:w-[500px] mt-2 text-sm font-bold text-gray-700">
        <span>Before</span>
        <span>After</span>
      </div>
    </div>
  );
}