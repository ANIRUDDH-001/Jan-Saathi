export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-t-[#FF9933] border-r-transparent border-b-[#138808] border-l-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
          Loading...
        </p>
      </div>
    </div>
  );
}
