'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationService } from '@/services/notificationService';
import { AuthService } from '@/services/authService';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import Link from 'next/link';

interface SettingsViewProps {
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export default function SettingsView({ onError, onSuccess }: SettingsViewProps) {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
      setNotificationsEnabled(NotificationService.areNotificationsEnabled());
    }
    
    // Vérifier l'état d'authentification
    const checkAuth = async () => {
      const authenticated = AuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        const currentUser = AuthService.getUser();
        setUser(currentUser);
      }
    };
    checkAuth();
  }, []);

  const handleToggleNotifications = async () => {
    setIsRequestingPermission(true);
    try {
      if (!notificationsEnabled) {
        await NotificationService.setNotificationsEnabled(true);
        setNotificationsEnabled(true);
        setNotificationPermission('granted');
        onSuccess?.('Notifications activées avec succès !');
      } else {
        await NotificationService.setNotificationsEnabled(false);
        setNotificationsEnabled(false);
        setNotificationPermission(Notification.permission);
        onSuccess?.('Notifications désactivées.');
      }
    } catch (error: any) {
      const message =
        error?.message ||
        'Impossible de modifier les notifications. Vérifiez les permissions de votre navigateur.';
      onError?.(message);
      setNotificationPermission(Notification.permission);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleTestNotification = async () => {
    if (!('Notification' in window)) {
      onError?.('Les notifications ne sont pas prises en charge par ce navigateur.');
      return;
    }

    setIsTestingNotification(true);
    try {
      const scheduled = await NotificationService.scheduleTestNotification();
      if (scheduled) {
        onSuccess?.('Notification de test programmée dans 10 secondes.');
      } else {
        onError?.('Impossible de programmer la notification de test. Vérifiez les permissions.');
      }
    } finally {
      setIsTestingNotification(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await AuthService.logout();
      setIsAuthenticated(false);
      setUser(null);
      onSuccess?.('Déconnexion réussie');
      // Optionnel : recharger la page pour réinitialiser l'état
      router.refresh();
    } catch (error) {
      onError?.('Erreur lors de la déconnexion');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Card className="border border-slate-800/70 bg-slate-900/60 shadow-2xl shadow-black/30 backdrop-blur">
      <CardHeader>
        <CardTitle>Paramètres</CardTitle>
        <CardDescription>Gérez vos préférences et notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Section Authentification */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-100">Compte</h3>
              <p className="mt-1 text-xs text-slate-400">
                {isAuthenticated
                  ? `Connecté en tant que ${user?.email || 'utilisateur'}`
                  : 'Connectez-vous pour synchroniser vos habitudes entre appareils'}
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto sm:shrink-0">
              {isAuthenticated ? (
                <>
                  <Link href="/account" className="flex-1 sm:flex-none">
                    <Button variant="outline" className="w-full sm:w-auto whitespace-nowrap">
                      Gérer mon compte
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full sm:w-auto"
                  >
                    {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" className="flex-1 sm:flex-none">
                    <Button variant="outline" className="w-full sm:w-auto">
                      Se connecter
                    </Button>
                  </Link>
                  <Link href="/register" className="flex-1 sm:flex-none">
                    <Button variant="default" className="w-full sm:w-auto">
                      S'inscrire
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-4">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-100">Notifications</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Recevez des rappels pour vos habitudes planifiées
                </p>
                {notificationPermission === 'denied' && (
                  <p className="mt-2 text-xs text-rose-300">
                    Les notifications sont bloquées. Veuillez les autoriser dans les paramètres de votre navigateur.
                  </p>
                )}
              </div>
              <Button
                variant={notificationsEnabled ? 'default' : 'outline'}
                onClick={handleToggleNotifications}
                disabled={isRequestingPermission}
                className="w-full sm:ml-4 sm:w-auto sm:shrink-0"
              >
                {isRequestingPermission ? 'Chargement...' : notificationsEnabled ? 'Activées' : 'Désactivées'}
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 sm:pr-4">
              <h3 className="text-sm font-semibold text-slate-100">Notification de test</h3>
              <p className="mt-1 text-xs text-slate-400">
                Programme une notification dans 10 secondes pour vérifier que tout fonctionne.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleTestNotification}
              disabled={
                isTestingNotification || notificationPermission === 'denied' || isRequestingPermission || !notificationsEnabled
              }
              className="w-full sm:w-auto sm:shrink-0"
            >
              {isTestingNotification ? 'Programmation...' : 'Tester'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

