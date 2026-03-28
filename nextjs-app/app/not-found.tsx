import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-6 p-8">
      <div className="text-8xl font-bold text-[#FF9933]" style={{ fontFamily: "'Lora', serif" }}>
        404
      </div>
      <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Lora', serif" }}>
        Page Not Found
      </h1>
      <p className="text-muted-foreground text-center max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-[#FF9933] text-white rounded-xl font-medium hover:opacity-90 transition"
      >
        Go Home
      </Link>
    </div>
  );
}
