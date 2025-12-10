'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// Importez vos composants UI
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/Icon'; // Assurez-vous que ce chemin est correct
import Link from 'next/link';

export function ResetPasswordForm() {
  const router = useRouter();
  // useSearchParams est utilisé dans ce composant client
  const searchParams = useSearchParams();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
      // Récupère le token du paramètre d'URL
    if (!searchParams) return;
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Token manquant. Vérifiez le lien reçu par email.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la réinitialisation');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la réinitialisation du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  // --- Rendu après succès ---
  if (success) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-violet-500/25 blur-[160px]" />
          <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-sky-500/20 blur-[140px]" />
          <div className="absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-emerald-400/10 blur-[150px]" />
        </div>

        <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md border border-slate-800/70 bg-slate-900/60 shadow-2xl shadow-black/30 backdrop-blur">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-2">
                <div className="rounded-full bg-gradient-to-r from-emerald-500 to-green-500 p-3">
                  <Icon name="check" className="h-6 w-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-center text-2xl">Mot de passe réinitialisé</CardTitle>
              <CardDescription className="text-center">
                Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la page de connexion...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/login">
                <Button className="w-full">Aller à la page de connexion</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- Rendu du formulaire principal ---
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-violet-500/25 blur-[160px]" />
        <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-sky-500/20 blur-[140px]" />
        <div className="absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-emerald-400/10 blur-[150px]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border border-slate-800/70 bg-slate-900/60 shadow-2xl shadow-black/30 backdrop-blur">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-2">
              <div className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 p-3">
                <Icon name="settings" className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Réinitialiser le mot de passe</CardTitle>
            <CardDescription className="text-center">
              Entrez votre nouveau mot de passe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-100">
                  {error}
                </div>
              )}

              {!token && (
                <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-100">
                  Aucun token trouvé. Vérifiez le lien reçu par email.
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium text-slate-200">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
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

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-200">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    <Icon name={showConfirmPassword ? 'eyeOff' : 'eye'} className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading || !token}>
                {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
              </Button>

              <div className="text-center text-sm text-slate-400">
                <Link
                  href="/login"
                  className="font-medium text-indigo-400 hover:text-indigo-300 underline-offset-4 hover:underline"
                >
                  Retour à la connexion
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}