import Link from 'next/link';

export default function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      {/* Header */}
      <header className="p-4 border-b border-purple-500/30 flex items-center gap-4">
        <Link 
          href="/"
          className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors"
        >
          <span className="text-2xl">←</span>
          <span>Back to Arcade</span>
        </Link>
      </header>
      
      {/* Game Content */}
      <main className="p-4">
        {children}
      </main>
    </div>
  );
}
