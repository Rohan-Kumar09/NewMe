import Link from "next/link";
import "@fontsource/comfortaa/700.css"; // bold

export default function Navbar() {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-sm border-b h-16 border-b border-black"
      style={{ backgroundColor: "#b7fff9ff" }}
    >

      <div className="flex h-full items-center justify-between px-6">


        {/* Logo + Text */}
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          <img
            src="/images/logo.png"
            alt="NewMe Logo"
            style={{
              height: "50px",
              width: "auto",
              marginRight: "15px",
              objectFit: "contain",
            }}
          />
          <span
            style={{
              fontFamily: "'Comfortaa', sans-serif",
              fontWeight: 700,
              fontSize: "1.5rem",
              color: "black",
            }}
          >
            NewMe
          </span>
        </Link>

        {/* Login Button */}
        <Link
          href="/api/auth/google"
          className="ml-4 inline-flex items-center px-4 py-2 text-black text-sm font-medium hover:underline"
          style={{ fontFamily: "'Comfortaa', sans-serif", fontWeight: 700, fontSize: "1rem" }}
        >
          Login
        </Link>
      </div>
    </header>
  );
}