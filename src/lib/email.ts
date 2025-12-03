import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  if (!resend) {
    console.error('RESEND_API_KEY n\'est pas défini. Impossible d\'envoyer l\'email.');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  try {
    await resend.emails.send({
      from: 'trackit@novaprojects.dev',
      to: email,
      subject: 'Réinitialisation de votre mot de passe - TrackIt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #334155;">Réinitialisation de votre mot de passe</h2>
          <p style="color: #64748b;">Vous avez demandé à réinitialiser votre mot de passe pour votre compte TrackIt.</p>
          <p style="color: #64748b;">Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Réinitialiser mon mot de passe</a>
          <p style="color: #64748b; font-size: 14px;">Ce lien expirera dans 1 heure.</p>
          <p style="color: #64748b; font-size: 14px;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return { success: false, error };
  }
}

export async function sendPasswordChangedEmail(email: string) {
  if (!resend) {
    console.error('RESEND_API_KEY n\'est pas défini. Impossible d\'envoyer l\'email.');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    await resend.emails.send({
      from: 'trackit@novaprojects.dev',
      to: email,
      subject: 'Votre mot de passe a été modifié - TrackIt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #334155;">Mot de passe modifié</h2>
          <p style="color: #64748b;">Votre mot de passe a été modifié avec succès.</p>
          <p style="color: #64748b;">Si vous n'avez pas effectué cette modification, veuillez nous contacter immédiatement.</p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return { success: false, error };
  }
}

