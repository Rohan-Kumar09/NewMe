import Link from "next/link";
import "@fontsource/comfortaa/700.css"; // bold

export default function Navbar() {
  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-sm border-b h-16"
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


// import Link from "next/link";
// import "@fontsource/comfortaa/700.css"; // 700 = bold


// export default function Navbar() {
//   return (
//     <header
//       className="sticky top-0 z-40 backdrop-blur-sm border-b h-16"
//       style={{ backgroundColor: "#b7fff9ff" }}
//     >
//       <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        
//         {/* <Link
//           href="/"
//           style={{ fontFamily: "'Comfortaa', sans-serif", fontWeight: 700, fontSize: "1.50rem", color: "black" }}
//         >
//           NewMe
//         </Link> */}

//         <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
//           <img
//             src="/images/logo.png"
//             alt="NewMe Logo"
//             style={{ height: "50px", width: "auto", marginRight: "10px" }}
//           />
//           <span
//             style={{ fontFamily: "'Comfortaa', sans-serif", fontWeight: 700, fontSize: "1.50rem", color: "black" }}
//           >
//             NewMe
//           </span>
//         </Link>

//         <nav className="flex items-center space-x-4">
//           <Link href="/gallery" className="text-xl text-amber-700 hover:text-indigo-600">
//             Gallery
//           </Link>
//           <Link href="/editor" className="text-xl text-amber-700 hover:text-indigo-600">
//             Try it
//           </Link>
//           <Link href="/about" className="text-xl text-amber-700 hover:text-indigo-600">
//             About
//           </Link>

//           <a
//             href="/api/auth/google"
//             className="ml-4 inline-flex items-center px-3 py-1 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
//           >
//             Sign in
//           </a>
//         </nav>
//       </div>
//     </header>
//   );
// }