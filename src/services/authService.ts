const TOKEN_KEY = 'trackit-auth-token';
const USER_KEY = 'trackit-user';

export interface User {
  id: string;
  email: string;
  pseudo?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export class AuthService {
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  static setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  }

  static removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  static getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  static setUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  static isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  static async register(email: string, password: string): Promise<{ token: string; user: User }> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de l\'inscription');
    }

    const data = await response.json();
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  }

  static async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la connexion');
    }

    const data = await response.json();
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  }

  static async logout(): Promise<void> {
    this.removeToken();
  }

  static async getMe(): Promise<{ user: User } | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // Ne supprimer le token que si c'est une erreur d'authentification (401)
        if (response.status === 401) {
          this.removeToken();
        }
        return null;
      }

      const data = await response.json();
      this.setUser(data.user);
      return data;
    } catch (error) {
      // En cas d'erreur réseau, ne pas supprimer le token
      // L'utilisateur peut toujours être connecté mais avoir un problème réseau
      console.error('Erreur lors de la récupération du profil:', error);
      return null;
    }
  }

  static getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }
}

