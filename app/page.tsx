"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import ImageComp from "@/app/components/ImageComp";
import Link from "next/link";

// Custom hook for scroll-triggered animations
function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return { ref, isVisible };
}

// Animated section wrapper component
function AnimatedSection({
  children,
  className = "",
  animation = "fadeInUp3D",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  animation?: string;
  delay?: number;
}) {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div
      ref={ref}
      className={`${className} ${
        isVisible ? `animate-${animation}` : "opacity-0"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// Animated Background Component - Organic flowing effects
function AnimatedBackground() {
  return (
    <div className="animated-bg">
      {/* Gradient Mesh Base */}
      <div className="gradient-mesh" />
      
      {/* Light Rays Effect */}
      <div className="light-rays" />
      
      {/* Floating Gradient Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
      <div className="orb orb-5" />
      
      {/* Sparkle Effects */}
      <div className="sparkle sparkle-1" />
      <div className="sparkle sparkle-2" />
      <div className="sparkle sparkle-3" />
      <div className="sparkle sparkle-4" />
      <div className="sparkle sparkle-5" />
      <div className="sparkle sparkle-6" />
      
      {/* Noise Texture */}
      <div className="noise-overlay" />
    </div>
  );
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  
  // Refs for scroll animations
  const beforeAfterRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);
  
  const [beforeAfterVisible, setBeforeAfterVisible] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);

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

  // Scroll animation observer
  useEffect(() => {
    const observerOptions = {
      threshold: 0.15,
      rootMargin: "0px 0px -80px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (entry.target === beforeAfterRef.current) {
            setBeforeAfterVisible(true);
          } else if (entry.target === featuresRef.current) {
            setFeaturesVisible(true);
          } else if (entry.target === ctaRef.current) {
            setCtaVisible(true);
          }
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    if (beforeAfterRef.current) observer.observe(beforeAfterRef.current);
    if (featuresRef.current) observer.observe(featuresRef.current);
    if (ctaRef.current) observer.observe(ctaRef.current);

    return () => observer.disconnect();
  }, []);

  const href = isLoggedIn ? "/editor" : "/try_it_now";

  return (
    <div className="min-h-screen perspective-container relative">
      {/* 3D Animated Background */}
      <AnimatedBackground />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-8 sm:pt-12 sm:pb-16">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-8 animate-fadeInDown3D">
              Discover the{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent animate-gradient">
                New You
              </span>
            </h1>
            <Link href={href}>
              <button className="inline-flex items-center px-8 py-4 text-base font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg shadow-lg btn-3d animate-fadeInUp3D delay-300 animate-pulseGlow">
                Try it Now
                <svg className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Before/After Section */}
      <section 
        ref={beforeAfterRef}
        className="py-8 sm:py-12 relative perspective-container"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
            <div 
              className={`text-center lg:text-right transition-all duration-700 ${
                beforeAfterVisible 
                  ? "animate-fadeInLeft3D" 
                  : "opacity-0 translate-x-[-50px]"
              }`}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Before</h2>
              <p className="text-gray-600">Your original look</p>
            </div>
            <div 
              className={`flex-shrink-0 transition-all duration-700 delay-200 ${
                beforeAfterVisible 
                  ? "animate-scaleIn3D" 
                  : "opacity-0 scale-90"
              }`}
              style={{ animationDelay: "200ms" }}
            >
              <ImageComp
                firstSrc="/images/before-homepage.png"
                secondSrc="/images/after-homepage.png"
                width={500}
              />
            </div>
            <div 
              className={`text-center lg:text-left transition-all duration-700 ${
                beforeAfterVisible 
                  ? "animate-fadeInRight3D" 
                  : "opacity-0 translate-x-[50px]"
              }`}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-2">After</h2>
              <p className="text-gray-600">AI-powered transformation</p>
            </div>
          </div>
          <div 
            className={`mt-4 text-center transition-all duration-700 ${
              beforeAfterVisible 
                ? "animate-fadeInUp3D" 
                : "opacity-0 translate-y-[30px]"
            }`}
            style={{ animationDelay: "400ms" }}
          >
            <p className="text-2xl font-semibold text-gray-800">
              No more wondering,{" "}
              <span className="text-primary animate-gradient bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">"Would I pull that off?"</span>
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        ref={featuresRef}
        className="py-16 sm:py-20 relative perspective-container backdrop-blur-sm bg-white/30"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 
              className={`text-3xl sm:text-4xl font-bold text-gray-900 mb-4 transition-all duration-700 ${
                featuresVisible 
                  ? "animate__animated animate__fadeInDown" 
                  : "opacity-0 translate-y-[-30px]"
              }`}
            >
              Why Choose NewMe?
            </h2>
            <p 
              className={`text-lg text-gray-600 max-w-2xl mx-auto transition-all duration-700 ${
                featuresVisible 
                  ? "animate__animated animate__fadeIn" 
                  : "opacity-0"
              }`}
              style={{ animationDelay: "200ms" }}
            >
              Experience the future of style experimentation with AI-powered technology
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div 
              className={`backdrop-blur-md bg-white/70 p-8 rounded-xl shadow-lg border border-white/50 card-3d transition-all duration-700 ${
                featuresVisible 
                  ? "animate-floatIn3D" 
                  : "opacity-0 translate-y-[60px]"
              }`}
              style={{ animationDelay: "100ms" }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center mb-4 backdrop-blur-sm">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered</h3>
              <p className="text-gray-600">
                Advanced AI technology transforms your photos with realistic style changes
              </p>
            </div>
            <div 
              className={`backdrop-blur-md bg-white/70 p-8 rounded-xl shadow-lg border border-white/50 card-3d transition-all duration-700 ${
                featuresVisible 
                  ? "animate-floatIn3D" 
                  : "opacity-0 translate-y-[60px]"
              }`}
              style={{ animationDelay: "300ms" }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-lg flex items-center justify-center mb-4 backdrop-blur-sm">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">
                Your photos are processed securely with Google authentication
              </p>
            </div>
            <div 
              className={`backdrop-blur-md bg-white/70 p-8 rounded-xl shadow-lg border border-white/50 card-3d transition-all duration-700 ${
                featuresVisible 
                  ? "animate-floatIn3D" 
                  : "opacity-0 translate-y-[60px]"
              }`}
              style={{ animationDelay: "500ms" }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-accent/20 to-accent/10 rounded-lg flex items-center justify-center mb-4 backdrop-blur-sm">
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
      <section 
        ref={ctaRef}
        className="py-16 sm:py-20 relative perspective-container overflow-hidden"
      >
        {/* CTA Background with glassmorphism */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-secondary/90 backdrop-blur-sm animate-gradient" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 
            className={`text-3xl sm:text-4xl font-bold text-white mb-4 transition-all duration-700 ${
              ctaVisible 
                ? "animate__animated animate__fadeInUp" 
                : "opacity-0 translate-y-[30px]"
            }`}
          >
            Ready to Transform Your Look?
          </h2>
          <p 
            className={`text-xl text-white/90 mb-8 transition-all duration-700 ${
              ctaVisible 
                ? "animate__animated animate__fadeIn" 
                : "opacity-0"
            }`}
            style={{ animationDelay: "200ms" }}
          >
            Join thousands of users discovering their new style with AI
          </p>
          <Link href={href}>
            <button 
              className={`inline-flex items-center px-8 py-4 text-base font-semibold text-primary bg-white/95 backdrop-blur-sm hover:bg-white rounded-lg shadow-lg btn-3d transition-all duration-700 ${
                ctaVisible 
                  ? "animate__animated animate__bounceIn" 
                  : "opacity-0 scale-75"
              }`}
              style={{ animationDelay: "400ms" }}
            >
              Get Started Free
              <svg className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}