import Link from "next/link";
import Image from "next/image";
import AuthButton from "./AuthButton";
import AuthAwareGallery from "./AuthAwareGallery";
import AuthAwareEditor from "./AuthAwareEditor";
import "@fontsource/comfortaa";


export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-12 items-center justify-between">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center space-x-3 no-underline group transition-opacity hover:opacity-80" 
              aria-label="Home"
            >
              <div className="relative">
                <Image
                  src="/images/logo.png"
                  alt="NewMe logo"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain transition-transform group-hover:scale-105"
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-geist">
                NewMe
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            <AuthAwareGallery />
            <AuthAwareEditor />
          </div>

          <div className="flex items-center">
            <AuthButton />
          </div>
        </div>
      </nav>
    </header>
  );
}