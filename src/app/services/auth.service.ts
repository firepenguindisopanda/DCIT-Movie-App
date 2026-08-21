import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  // Signals for reactive state
  private _user = signal<User | null>(null);
  private _loading = signal<boolean>(true);
  private _error = signal<string | null>(null);

  // Computed signals
  readonly user = computed(() => this._user());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly isAuthenticated = computed(() => !!this._user());
  readonly userEmail = computed(() => this._user()?.email ?? null);

  /**
   * Resolves once the initial session check has finished.
   *
   * Route guards need this: on a cold load or refresh they run before Supabase
   * has restored the session, and without waiting they see loading() === true
   * and treat it as "signed out".
   */
  private readonly ready: Promise<void>;

  constructor() {
    this.ready = this.initAuth();
  }

  /** Awaits the initial session check. Resolves immediately once settled. */
  whenReady(): Promise<void> {
    return this.ready;
  }

  private async initAuth(): Promise<void> {
    try {
      // Check current session only once
      const { data: { session }, error } = await this.supabase.client.auth.getSession();
      
      if (error) {
        console.warn('Auth session error:', error.message);
      }
      
      if (session?.user) {
        this._user.set(session.user);
      }
    } catch (err) {
      console.warn('Failed to get auth session:', err);
    } finally {
      this._loading.set(false);
    }

    // Single auth state listener - use a flag to prevent duplicate handling
    let isHandlingAuthChange = false;
    
    this.supabase.client.auth.onAuthStateChange((event, session) => {
      // Prevent nested calls
      if (isHandlingAuthChange) return;
      isHandlingAuthChange = true;
      
      try {
        // Handle all auth events
        this._user.set(session?.user ?? null);
      } finally {
        // Use setTimeout to reset the flag after the current execution
        setTimeout(() => {
          isHandlingAuthChange = false;
        }, 0);
      }
    });
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const { data, error } = await this.supabase.signIn(email, password);
      
      if (error) {
        this._error.set(error.message);
        this._loading.set(false);
        return { success: false, error: error.message };
      }

      this._user.set(data.user);
      this._loading.set(false);
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'An unexpected error occurred';
      this._error.set(errorMsg);
      this._loading.set(false);
      return { success: false, error: errorMsg };
    }
  }

  async signUp(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const { data, error } = await this.supabase.signUp(email, password);
      
      if (error) {
        this._error.set(error.message);
        this._loading.set(false);
        return { success: false, error: error.message };
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        this._loading.set(false);
        return { 
          success: true, 
          error: 'SUCCESS: Please check your email to confirm your account!' 
        };
      }

      this._user.set(data.user);
      this._loading.set(false);
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.message || 'An unexpected error occurred';
      this._error.set(errorMsg);
      this._loading.set(false);
      return { success: false, error: errorMsg };
    }
  }

  async signOut(): Promise<void> {
    this._loading.set(true);
    
    await this.supabase.signOut();
    
    this._user.set(null);
    this._loading.set(false);
    this.router.navigate(['/']);
  }

  clearError(): void {
    this._error.set(null);
  }
}
