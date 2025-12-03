'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/Icon';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Si déjà connecté, rediriger vers la page d'accueil
    if (AuthService.isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await AuthService.login(email, password);
      // Synchroniser les habitudes après connexion
      const { HabitStorage } = await import('@/services/habitStorage');
      try {
        await HabitStorage.syncAll();
      } catch (syncError) {
        console.error('Erreur lors de la synchronisation:', syncError);
      }
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-violet-500/25 blur-[160px]" />
        <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-sky-500/20 blur-[140px]" />
        <div className="absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-emerald-400/10 blur-[150px]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="absolute top-4 left-4">
          <Link href="/">
            <Button variant="ghost" size="icon" aria-label="Retour à l'accueil">
              <Icon name="close" className="h-5 w-5" />
            </Button>
          </Link>
        </div>
        <Card className="w-full max-w-md border border-slate-800/70 bg-slate-900/60 shadow-2xl shadow-black/30 backdrop-blur">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-2">
              <div className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-3">
                <Icon name="settings" className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Connexion</CardTitle>
            <CardDescription className="text-center">
              Connectez-vous pour synchroniser vos habitudes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-100">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-200">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-200">
                  Mot de passe
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" loading={loading}>
                Se connecter
              </Button>

              <div className="space-y-2 text-center text-sm text-slate-400">
                <div>
                  <Link
                    href="/forgot-password"
                    className="font-medium text-indigo-400 hover:text-indigo-300 underline-offset-4 hover:underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div>
                  <span>Pas encore de compte ? </span>
                  <Link
                    href="/register"
                    className="font-medium text-indigo-400 hover:text-indigo-300 underline-offset-4 hover:underline"
                  >
                    S'inscrire
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

