import BackgroundVideo from "@/components/common/BackgroundVideo";

export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen bg-[#141416] text-white flex flex-col justify-start sm:justify-center items-center overflow-x-hidden overflow-y-auto font-sans">
      {/* Looping Flutter App background video */}
      <BackgroundVideo opacity={0.4} />

      {/* Content wrapper */}
      <div className="relative z-10 w-full max-w-[500px] px-4 py-6 sm:py-8 flex flex-col items-center my-auto">
        {children}
      </div>
    </div>
  );
}
