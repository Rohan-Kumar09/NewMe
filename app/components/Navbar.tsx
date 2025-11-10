import Link from "next/link";
import Image from "next/image";
import AuthButton from "./AuthButton";
import AuthAwareGallery from "./AuthAwareGallery";
import AuthAwareEditor from "./AuthAwareEditor";

export default function Navbar() {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-sm h-16 border-b border-black"
      style={{ backgroundColor: "#b7fff9ff" }}
    >
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center justify-center">
          <Link href="/" className="flex items-center no-underline" aria-label="Home">
            <Image
              src="/images/logo.png"
              alt="NewMe logo"
              width={48}
              height={48}
              className="object-contain"
            />
            <span className="ml-2 text-black font-semibold text-2xl font-['Comfortaa',sans-serif]">
              NewMe
            </span>
          </Link>
        </div>

        {/* Right side nav */}
        <div className="flex">
          {/* Gallery and Editor only visible when authenticated */}
          <AuthAwareGallery />
          <AuthAwareEditor />

          {/* Auth button shows either Login or Logout depending on session */}
          <AuthButton />
        </div>
      </div>
    </header>
  );
}