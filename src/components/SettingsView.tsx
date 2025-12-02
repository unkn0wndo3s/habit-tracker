'use client';

import { useState, useEffect } from 'react';
import { NotificationService } from '@/services/notificationService';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

interface SettingsViewProps {
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export default function SettingsView({ onError, onSuccess }: SettingsViewProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isTestingNotification, setIsTestingNotification] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
      setNotificationsEnabled(NotificationService.areNotificationsEnabled());
    }
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

  return (
    <Card className="border border-slate-800/70 bg-slate-900/60 shadow-2xl shadow-black/30 backdrop-blur">
      <CardHeader>
        <CardTitle>Paramètres</CardTitle>
        <CardDescription>Gérez vos préférences et notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
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

