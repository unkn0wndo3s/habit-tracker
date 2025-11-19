'use client';

import { useState, useEffect } from 'react';
import { NotificationService } from '@/services/notificationService';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

interface SettingsViewProps {
  onClose: () => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export default function SettingsView({ onClose, onError, onSuccess }: SettingsViewProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
      setNotificationsEnabled(NotificationService.areNotificationsEnabled());
    }
  }, []);

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      // Activer les notifications
      setIsRequestingPermission(true);
      const granted = await NotificationService.requestPermission();
      setIsRequestingPermission(false);

      if (granted) {
        NotificationService.setNotificationsEnabled(true);
        setNotificationsEnabled(true);
        setNotificationPermission('granted');
        onSuccess?.('Notifications activées avec succès !');
      } else {
        onError?.('Les notifications ont été refusées. Veuillez les autoriser dans les paramètres de votre navigateur.');
        setNotificationPermission('denied');
      }
    } else {
      // Désactiver les notifications
      NotificationService.setNotificationsEnabled(false);
      setNotificationsEnabled(false);
      onSuccess?.('Notifications désactivées.');
    }
  };

  return (
    <Card className="bg-white/95">
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Paramètres</CardTitle>
          <CardDescription>Gérez vos préférences et notifications</CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer les paramètres">
          ✕
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
              <p className="text-xs text-slate-600 mt-1">
                Recevez des rappels pour vos habitudes planifiées
              </p>
              {notificationPermission === 'denied' && (
                <p className="text-xs text-rose-600 mt-2">
                  Les notifications sont bloquées. Veuillez les autoriser dans les paramètres de votre navigateur.
                </p>
              )}
            </div>
            <Button
              variant={notificationsEnabled ? 'default' : 'outline'}
              onClick={handleToggleNotifications}
              disabled={isRequestingPermission || notificationPermission === 'denied'}
              className="ml-4"
            >
              {isRequestingPermission ? 'Demande...' : notificationsEnabled ? 'Activées' : 'Désactivées'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

