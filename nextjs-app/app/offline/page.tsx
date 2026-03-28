export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6 bg-[#000020]">
      <div className="text-center text-white">
        <h1 className="text-2xl font-bold text-[#FF9933]">Jan Saathi</h1>
        <p className="mt-4 text-white/70">
          Network nahi hai. Cached yojanaein dekh sakte hain.
        </p>
      </div>
      <a 
        href="/schemes"
        className="px-6 py-3 rounded-full bg-[#FF9933] text-white font-semibold"
      >
        Cached Yojanaein Dekhein
      </a>
    </div>
  );
}
