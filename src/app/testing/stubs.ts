import { signal, computed } from '@angular/core';

/**
 * Minimal stand-ins for the services that reach Supabase.
 *
 * Component specs only assert that a component constructs; without these the
 * real services build a Supabase client and fire network calls from ngOnInit.
 */
export const supabaseServiceStub = {
  client: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    channel: () => ({ on: () => ({ on: () => ({ subscribe: () => ({}) }) }) }),
    removeChannel: () => Promise.resolve('ok')
  },
  getMovies: () => Promise.resolve({ data: [], error: null }),
  getGames: () => Promise.resolve({ data: [], error: null }),
  getGenres: () => Promise.resolve({ data: [], error: null }),
  getGameGenres: () => Promise.resolve({ data: [], error: null }),
  getMovieById: () => Promise.resolve({ data: null, error: null }),
  getGameById: () => Promise.resolve({ data: null, error: null }),
  searchMovies: () => Promise.resolve({ data: [], error: null }),
  searchGames: () => Promise.resolve({ data: [], error: null }),
  getComments: () => Promise.resolve({ data: [], error: null }),
  checkIsFavorite: () => Promise.resolve({ data: null, error: null })
};

const stubUser = signal<{ id: string; email: string } | null>(null);

export const authServiceStub = {
  user: stubUser,
  loading: signal(false),
  error: signal(null),
  isAuthenticated: computed(() => !!stubUser()),
  userEmail: computed(() => stubUser()?.email ?? null),
  whenReady: () => Promise.resolve()
};
