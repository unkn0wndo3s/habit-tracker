'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/Icon';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  pseudo?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export default function AccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Formulaire profil
  const [pseudo, setPseudo] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // Formulaire mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      if (!AuthService.isAuthenticated()) {
        router.push('/login');
        return;
      }

      // Essayer de charger le profil depuis le localStorage d'abord
      const cachedUser = AuthService.getUser();
      if (cachedUser) {
        setUser(cachedUser);
        setPseudo(cachedUser.pseudo || '');
        setFirstName(cachedUser.firstName || '');
        setLastName(cachedUser.lastName || '');
        setLoading(false);
      }

      // Ensuite, essayer de récupérer les données à jour depuis l'API
      await loadProfile();
    };

    checkAuthAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userData = await AuthService.getMe();
      if (userData?.user) {
        setUser(userData.user);
        setPseudo(userData.user.pseudo || '');
        setFirstName(userData.user.firstName || '');
        setLastName(userData.user.lastName || '');
      } else {
        // Si getMe() échoue mais que l'utilisateur a un token, utiliser les données en cache
        const cachedUser = AuthService.getUser();
        if (cachedUser) {
          setUser(cachedUser);
          setPseudo(cachedUser.pseudo || '');
          setFirstName(cachedUser.firstName || '');
          setLastName(cachedUser.lastName || '');
        } else {
          // Seulement rediriger si vraiment pas de token ni de données en cache
          if (!AuthService.isAuthenticated()) {
            router.push('/login');
          }
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement du profil:', err);
      // En cas d'erreur, utiliser les données en cache si disponibles
      const cachedUser = AuthService.getUser();
      if (cachedUser) {
        setUser(cachedUser);
        setPseudo(cachedUser.pseudo || '');
        setFirstName(cachedUser.firstName || '');
        setLastName(cachedUser.lastName || '');
      } else if (!AuthService.isAuthenticated()) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const token = AuthService.getToken();
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pseudo: pseudo.trim() || null,
          firstName: firstName.trim() || null,
          lastName: lastName.trim() || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      setUser(data.user);
      setSuccess('Profil mis à jour avec succès');
      
      // Mettre à jour le user dans le localStorage
      AuthService.setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setSaving(true);

    try {
      const token = AuthService.getToken();
      if (!token) {
        throw new Error('Non authentifié');
      }

      const response = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la modification du mot de passe');
      }

      setSuccess('Mot de passe modifié avec succès. Un email de confirmation vous a été envoyé.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification du mot de passe');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="text-slate-400">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-violet-500/25 blur-[160px]" />
        <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-sky-500/20 blur-[140px]" />
        <div className="absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-emerald-400/10 blur-[150px]" />
      </div>

      <div className="relative z-10 min-h-screen p-4 py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <Icon name="close" className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-slate-100">Gestion du compte</h1>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-100">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              {success}
            </div>
          )}

          {/* Informations du compte */}
          <Card className="border border-slate-800/70 bg-slate-900/60 shadow-2xl shadow-black/30 backdrop-blur">
            <CardHeader>
              <CardTitle>Informations du compte</CardTitle>
              <CardDescription>
                Email: {user?.email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="pseudo" className="text-sm font-medium text-slate-200">
                    Pseudo
                  </label>
                  <Input
                    id="pseudo"
                    type="text"
                    placeholder="Votre pseudo"
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value)}
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-slate-200">
                    Prénom
                  </label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Votre prénom"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-slate-200">
                    Nom
                  </label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Votre nom"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Changement de mot de passe */}
          <Card className="border border-slate-800/70 bg-slate-900/60 shadow-2xl shadow-black/30 backdrop-blur">
            <CardHeader>
              <CardTitle>Changer le mot de passe</CardTitle>
              <CardDescription>
                Modifiez votre mot de passe. Un email de confirmation vous sera envoyé.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="currentPassword" className="text-sm font-medium text-slate-200">
                    Mot de passe actuel
                  </label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                      aria-label={showCurrentPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      <Icon name={showCurrentPassword ? 'eyeOff' : 'eye'} className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-sm font-medium text-slate-200">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                      aria-label={showNewPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      <Icon name={showNewPassword ? 'eyeOff' : 'eye'} className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-200">
                    Confirmer le nouveau mot de passe
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

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? 'Modification...' : 'Modifier le mot de passe'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

