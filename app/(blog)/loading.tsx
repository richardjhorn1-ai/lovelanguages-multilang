export default function BlogLoading() {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(180deg, #f9fafb 0%, #fff0f3 35%, #fdfcfd 65%, #f0f7ff 100%)' }}
    >
      {/* Nav placeholder */}
      <div
        className="h-14 sticky top-0 z-50"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,71,97,0.08)',
        }}
      />

      {/* Hero placeholder */}
      <div
        className="h-64 md:h-80 animate-pulse"
        style={{ background: 'linear-gradient(135deg, #ffe0e6 0%, #fce4ec 50%, #e8f5e9 100%)' }}
      />

      {/* Content card placeholder */}
      <main className="max-w-3xl mx-auto px-4 -mt-16 relative z-10 pb-16">
        <div
          className="rounded-[20px] p-6 md:p-10 space-y-4"
          style={{
            background: 'rgba(255,255,255,0.90)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
            border: '1px solid rgba(255,255,255,0.6)',
          }}
        >
          <div className="h-4 bg-gray-200/60 rounded animate-pulse w-1/4" />
          <div className="h-8 bg-gray-200/60 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-200/60 rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-200/60 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-gray-200/60 rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-200/60 rounded animate-pulse w-2/3" />
        </div>
      </main>
    </div>
  );
}
