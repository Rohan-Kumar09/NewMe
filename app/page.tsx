"use client";


import React, { useEffect, useState, useRef } from "react";
import ImageComp from "@/app/components/ImageComp";
import Link from "next/link";


import { useAnimateOnScroll } from "@/app/hooks/useAnimateOnScroll";


import ComparisonSection from "@/app/components/ComparisonSection"; // adjust path if needed




export default function Home() {
 const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const bounceRef = useAnimateOnScroll<HTMLHeadingElement>("animate__bounceInDown animate__faster");
 const tryItNow = useAnimateOnScroll<HTMLButtonElement>("animate__pulse");


 const aiRef = useAnimateOnScroll<HTMLDivElement>("animate__slideInLeft animate__slower");
 const secureRef = useAnimateOnScroll<HTMLDivElement>("animate__fadeInDown animate__slower");
 const easyRef = useAnimateOnScroll<HTMLDivElement>("animate__slideInRight animate__slower");


 const getStarted = useAnimateOnScroll<HTMLButtonElement>("animate__pulse");




 useEffect(() => {
   let mounted = true;
   fetch("/api/auth/me")
     .then((res) => res.json())
     .then((data) => {
       if (!mounted) return;
       setIsLoggedIn(Boolean(data?.authenticated));
     })
     .catch(() => {
       if (!mounted) return;
       setIsLoggedIn(false);
     });
   return () => {
     mounted = false;
   };
 }, []);


 const href = isLoggedIn ? "/editor" : "/try_it_now";


 return (
   <div className="min-h-screen bg-white">
     <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-primary/5">
       <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8 sm:pt-12 sm:pb-16">
         <div className="text-center animate-fade-in">
           <h1 ref={bounceRef} className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-8 animate__slower">
             Discover the{" "}
             <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
               New You
             </span>
           </h1>
           <Link href={href}>
             <button ref={tryItNow} className="inline-flex items-center px-8 py-4 text-base font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
               Try it Now
               <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
               </svg>
             </button>
           </Link>
         </div>
       </div>
     </section>


     <section className="py-8 sm:py-12 bg-white">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
           <ComparisonSection />


         </div>
         <div className="mt-4 text-center">
           <p className="text-2xl font-semibold text-gray-800">
             No more wondering,{" "}
             <span className="text-primary">"Would I pull that off?"</span>
           </p>
         </div>
       </div>
     </section>


     <section className="py-16 sm:py-20 bg-gray-50">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="text-center mb-12">
           <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
             Why Choose NewMe?
           </h2>
           <p className="text-lg text-gray-600 max-w-2xl mx-auto">
             Experience the future of style experimentation with AI-powered technology
           </p>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div ref={aiRef} className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
             <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
               <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
               </svg>
             </div>
             <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered</h3>
             <p className="text-gray-600">
               Advanced AI technology transforms your photos with realistic style changes
             </p>
           </div>
           <div ref={secureRef} className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
             <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
               <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
               </svg>
             </div>
             <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Private</h3>
             <p className="text-gray-600">
               Your photos are processed securely with Google authentication
             </p>
           </div>
           <div ref={easyRef} className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200">
             <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
               <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
             </div>
             <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy to Use</h3>
             <p className="text-gray-600">
               Simple, intuitive interface that makes style experimentation effortless
             </p>
           </div>
         </div>
       </div>
     </section>


     {/* CTA Section */}
     <section className="py-16 sm:py-20 bg-gradient-to-r from-primary to-secondary">
       <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
         <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
           Ready to Transform Your Look?
         </h2>
         <p className="text-xl text-white/90 mb-8">
           Join thousands of users discovering their new style with AI
         </p>
         <Link href={href}>
           <button ref={getStarted} className="inline-flex items-center px-8 py-4 text-base font-semibold text-primary bg-white hover:bg-gray-50 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
             Get Started Free
             <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
             </svg>
           </button>
         </Link>
       </div>
     </section>
   </div>
 );
}
