import { Suspense } from 'react';
import { ResetPasswordForm } from './ResetPasswordForm'; // Importez le composant que vous venez de créer

/**
 * Composant de secours affiché pendant l'hydratation (avant que useSearchParams ne soit disponible).
 * Ceci prévient l'erreur de Next.js.
 */
const LoadingFallback = () => (
  <div className="relative min-h-screen overflow-hidden">
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-violet-500/25 blur-[160px]" />
      <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-sky-500/20 blur-[140px]" />
      <div className="absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-emerald-400/10 blur-[150px]" />
    </div>
    
    <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
      <div className="rounded-xl border border-slate-800/70 bg-slate-900/60 p-6 text-lg text-slate-300 shadow-2xl">
        Chargement de la page de réinitialisation...
      </div>
    </div>
  </div>
);

/**
 * Composant de page (Server Component par défaut).
 * Il enveloppe le composant client avec Suspense pour gérer l'accès à useSearchParams.
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}