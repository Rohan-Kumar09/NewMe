import Link from "next/link";

export default function TryitNow() {
  return (
    <div
      className="min-h-screen flex flex-col items-center pt-15 text-black bg-[#8df6ddff] font-['Lexend',sans-serif] bg-[radial-gradient(#fef5fe_2px,transparent_2px),radial-gradient(#fef5fe_2px,transparent_2px)] bg-size-[80px_80px] bg-position-[0_0,40px_40px] bg-blend-overlay"
    >
      <p className="text-[30px]">Start Your Style Adventure</p>
      <p className="text-[18px] mt-5 text-black text-center">
        Explore new hairstyles and colors from your Google Photos! Let AI spark <br /> your creativity — it’s fun, easy, and completely safe.
      </p>

      {/* Google Sign-In Button */}
      <Link href="/api/auth/google">
        <div
          className="mt-30 flex items-center justify-center gap-20 bg-white text-black rounded-2xl px-20 py-8 shadow-md cursor-pointer hover:shadow-lg transition-all duration-200"
        >
          <img
            src="/images/google_logo.png"
            alt="Google Logo"
            className="w-30 h-30"
          />
          <span className="text-[38px]">Sign in with Google</span>
        </div>
      </Link>

      {/* Text under the button */}
      <div className="text-lg mt-30 text-black text-center">
        <p>So close to seeing the magic…</p>
        <p>Just a click away</p>
      </div>
      
    </div>
  );
}