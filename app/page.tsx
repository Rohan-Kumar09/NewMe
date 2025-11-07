"use client"; // <-- Add this at the very top

import { useEffect } from "react";
import "@fontsource/lexend";
import Link from "next/link";

// avoid JSX intrinsic checks for the custom web component by using a runtime tag alias
const ImgComparison: any = "img-comparison-slider";

export default function Home() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.querySelector('script[data-img-comparison]')) return;
    const s = document.createElement("script");
    s.src = "https://unpkg.com/img-comparison-slider@7/dist/index.js";
    s.defer = true;
    s.setAttribute("data-img-comparison", "1");
    document.body.appendChild(s);
  }, []);

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
        <div className="px-3">before</div>
        <div className="relative mt-10 w-auto h-auto overflow-hidden shadow-lg bg-[#152f40ff]">
          <ImgComparison style={{  }}>
            <img
              slot="first"
              src="/images/before-homepage.png"
              alt="Before"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            <img
              slot="second"
              src="/images/after-homepage.png"
              alt="After"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
          </ImgComparison>
        </div>

        <div className="px-3">
          <span>After</span>
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