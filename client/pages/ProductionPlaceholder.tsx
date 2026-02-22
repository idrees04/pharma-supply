import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

export default function ProductionPlaceholder() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div
        className={`transform transition-all duration-1000 ${
          animate ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <Card className="backdrop-blur-sm border-slate-700 bg-slate-800/50 p-12 max-w-2xl text-center shadow-2xl">
          <div className="mb-6">
            <div className="inline-block p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-6">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white mb-3">
            Production Deployment in Progress
          </h1>

          <p className="text-xl text-slate-300 mb-8">
            This application is being prepared for production deployment. All mock data and demo functionality have been removed for a clean, production-ready system.
          </p>

          <div className="space-y-4 text-left bg-slate-900/50 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-green-400 font-bold">✓</span>
              <span className="text-slate-200">Mock data removed</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400 font-bold">✓</span>
              <span className="text-slate-200">Clean Express server configured</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400 font-bold">✓</span>
              <span className="text-slate-200">Production build optimization</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400 font-bold">✓</span>
              <span className="text-slate-200">Vercel deployment ready</span>
            </div>
          </div>

          <p className="text-sm text-slate-400">
            API: Available at /api/health for health checks
          </p>
        </Card>
      </div>
    </div>
  );
}
