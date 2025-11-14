import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';

export type UserRole = 'ADMIN' | 'JUGADOR';

export interface AuthState {
  token: string;
  username: string;
  role: UserRole;
  jugadorId?: number | null;
}

interface LoginResponse {
  token: string;
  username: string;
  role: UserRole;
  jugadorId?: number | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'regata-auth-state';
  private readonly http = inject(HttpClient);
  private readonly state$ = new BehaviorSubject<AuthState | null>(this.loadFromStorage());

  login(username: string, password: string): Observable<AuthState> {
    return this.http.post<LoginResponse>('/api/auth/login', { username, password }).pipe(
      map(response => ({
        token: response.token,
        username: response.username,
        role: response.role,
        jugadorId: response.jugadorId ?? null,
      })),
      tap(state => this.persistState(state))
    );
  }

  logout(): void {
    this.persistState(null);
  }

  authStateChanges(): Observable<AuthState | null> {
    return this.state$.asObservable();
  }

  get token(): string | null {
    return this.state$.value?.token ?? null;
  }

  get role(): UserRole | null {
    return this.state$.value?.role ?? null;
  }

  get username(): string | null {
    return this.state$.value?.username ?? null;
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  private persistState(state: AuthState | null): void {
    this.state$.next(state);
    const storage = this.safeStorage();
    if (!storage) {
      return;
    }
    if (state) {
      storage.setItem(this.storageKey, JSON.stringify(state));
    } else {
      storage.removeItem(this.storageKey);
    }
  }

  private loadFromStorage(): AuthState | null {
    const storage = this.safeStorage();
    if (!storage) {
      return null;
    }
    const raw = storage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthState;
    } catch {
      storage.removeItem(this.storageKey);
      return null;
    }
  }

  private safeStorage(): Storage | null {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }
}
