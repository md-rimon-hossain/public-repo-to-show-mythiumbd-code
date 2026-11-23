"use client";

import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-mesh text-white">
      <div 
        className="glass-card p-12 max-w-lg w-full text-center rounded-3xl"
      >
        <h1 className="text-9xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-black dark:from-white dark:to-gray-400">
          404
        </h1>
        <h2 className="text-3xl font-bold mb-6">Page Not Found</h2>
        <p className="text-muted-foreground mb-8 text-lg">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <Link 
          href="/" 
          className="glass-button w-full h-14 flex items-center justify-center gap-2 bg-black hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 text-white font-semibold rounded-xl text-lg transition-all"
        >
          <Home size={20} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
