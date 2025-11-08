"use client";

import ImageComp from "./components/ImageComp";
import "@fontsource/lexend";
import Link from "next/link";

export default function Home() {
  return (
    <div
      className="min-h-screen flex flex-col items-center pt-15 text-black bg-[#8df6ddff]"
      style={{ fontFamily: "'Lexend', sans-serif", 
        backgroundColor: "#8df6ddff", // base color stays
        backgroundImage:
          "radial-gradient(#fef5fe 2px, transparent 2px), radial-gradient(#fef5fe 2px, transparent 2px)", // white dots
        backgroundSize: "80px 80px",
        backgroundPosition: "0 0, 40px 40px",
        backgroundBlendMode: "overlay", // makes sure base color shows through
      }}
    >
      <p className="text-[1.5rem]">Discover the New You</p>
      <p className="text-lg mt-5 text-black text-center">
        The possibilities are endless — AI reinvents your style, no scissors required.
      </p>

      <div className="flex flex-row items-center">
        <div className="px-3 text-xl">before</div>
        <ImageComp
          firstSrc="/images/before-homepage.png"
          secondSrc="/images/after-homepage.png"
          className="my-5 mx-3"
        />
        <div className="px-3 text-xl"><span>After</span></div>
      </div>

      {/* Examples showing size/width props for ImageComp */}
      <div className="flex flex-row items-center">
        {/* Example 1: fixed 100x100 (not responsive) */}
        <div className="mx-3">
          <ImageComp
            firstSrc="/images/original_photos.png"
            secondSrc="/images/styled_photos.png"
            size={100}
            responsive={false}
            fit="cover"
          />
        </div>

        {/* Example 2: responsive max width 300px (scales with parent) */}
        <div className="mx-3 w-[300px]"> 
          <ImageComp
            firstSrc="/images/original_photos.png"
            secondSrc="/images/styled_photos.png"
            fit="contain"
          />
        </div>
      </div>

      {/* ✨ New text below the image */}
      <p className="mt-5 text-center text-lg font-medium text-black">
        No more wondering, <br /> “Would I pull that off?”
      </p>

      {/* 🌈 Try it Now button */}
      <Link href="/try_it_now">
        <button
          className="mt-4 w-36 h-10 text-black text-lg rounded-full border border-black shadow-md transition-transform transform hover:scale-105"
          style={{
            background: "#8df6ddff",
          }}
        >
          Try it Now
        </button>
      </Link>

    </div>
  );
}