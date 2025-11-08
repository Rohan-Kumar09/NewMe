import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-sm h-16 border-b border-black"
      style={{ backgroundColor: "#b7fff9ff" }}
    >
      <div className="flex h-full items-center justify-between px-6">
        {/* Logo + Text */}
        <Link href="/" className="flex items-center no-underline" aria-label="Home">
          <Image
            src="/images/logo.png"
            alt="NewMe logo"
            width={50}
            height={50}
            className="mr-4 object-contain"
          />
          <span className="text-black font-medium text-2xl font-['Comfortaa',sans-serif]">
            NewMe
          </span>
        </Link>

        <div className="">
          {/* Nav Buttons */}
            <Link
              href="/gallery"
              className="ml-4 inline-flex items-center px-4 py-2 text-black text-2xl font-medium hover:underline font-['Comfortaa',sans-serif]"
            >
            Gallery
            </Link>

            {/* Login Button */}
            <Link
              href="/api/auth/google"
              className="ml-4 inline-flex items-center px-4 py-2 text-black text-2xl font-medium hover:underline font-['Comfortaa',sans-serif]"
            >
            Login
            </Link>
        </div>
      </div>
    </header>
  );
}