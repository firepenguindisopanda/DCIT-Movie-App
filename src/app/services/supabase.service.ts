import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: localStorage
        }
      }
    );
  }

  get client() {
    return this.supabase;
  }
  async signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }

  async signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }

  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  // Listen to auth changes
  authStateChanges(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }
  /**
   * PostgREST caps an unbounded select at 1000 rows and gives no indication it
   * truncated. The games table is larger than that, so list queries page
   * explicitly rather than silently losing everything past row 1000.
   */
  private async fetchAll<T>(
    page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>
  ): Promise<{ data: T[]; error: any }> {
    const PAGE_SIZE = 1000;
    const rows: T[] = [];

    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await page(from, from + PAGE_SIZE - 1);
      if (error) return { data: rows, error };
      if (!data || data.length === 0) break;
      rows.push(...data);
      // A short page means we reached the end.
      if (data.length < PAGE_SIZE) break;
    }

    return { data: rows, error: null };
  }

  async getMovies() {
    return this.fetchAll((from, to) =>
      this.supabase.from('movies').select('*').range(from, to)
    );
  }

  async getMovieById(id: number) {
    return this.supabase.from('movies').select('*').eq('tmdb_id', id).single();
  }

  async getMoviesByGenre(genre: string) {
    return this.fetchAll((from, to) =>
      this.supabase.from('movies').select('*').contains('genres', [genre]).range(from, to)
    );
  }

  async searchMovies(query: string) {
    return this.fetchAll((from, to) =>
      this.supabase.from('movies').select('*').ilike('title', `%${query}%`).range(from, to)
    );
  }

  async getGenres() {
    return this.supabase.from('movie_genres').select('*').order('name');
  }
  async getGames() {
    return this.fetchAll((from, to) =>
      this.supabase.from('games').select('*').range(from, to)
    );
  }

  async getGameById(id: number) {
    return this.supabase.from('games').select('*').eq('id', id).single();
  }

  async getGamesByGenre(genre: string) {
    return this.fetchAll((from, to) =>
      this.supabase.from('games').select('*').contains('genres', [genre]).range(from, to)
    );
  }

  async searchGames(query: string) {
    return this.fetchAll((from, to) =>
      this.supabase.from('games').select('*').ilike('name', `%${query}%`).range(from, to)
    );
  }

  async getGameGenres() {
    return this.supabase.from('game_genres').select('*').order('name');
  }

  async addFavorite(userId: string, mediaType: 'movie' | 'game', mediaId: number) {
    return this.supabase.from('favorites').insert({
      user_id: userId,
      media_type: mediaType,
      media_id: mediaId
    });
  }

  async removeFavorite(userId: string, mediaType: 'movie' | 'game', mediaId: number) {
    return this.supabase.from('favorites').delete()
      .eq('user_id', userId)
      .eq('media_type', mediaType)
      .eq('media_id', mediaId);
  }

  async getUserFavorites(userId: string) {
    return this.supabase.from('favorites').select('*').eq('user_id', userId);
  }

  async checkIsFavorite(userId: string, mediaType: 'movie' | 'game', mediaId: number) {
    return this.supabase.from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('media_type', mediaType)
      .eq('media_id', mediaId)
      .single();
  }

  async addComment(userId: string, userEmail: string, mediaType: 'movie' | 'game', mediaId: number, content: string) {
    return this.supabase.from('comments').insert({
      user_id: userId,
      user_email: userEmail,
      media_type: mediaType,
      media_id: mediaId,
      content: content
    });
  }

  async getComments(mediaType: 'movie' | 'game', mediaId: number) {
    return this.supabase.from('comments')
      .select('*')
      .eq('media_type', mediaType)
      .eq('media_id', mediaId)
      .order('created_at', { ascending: false });
  }

  async getUserComments(userId: string) {
    return this.supabase.from('comments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  }

  async deleteComment(commentId: string, userId: string) {
    return this.supabase.from('comments').delete()
      .eq('id', commentId)
      .eq('user_id', userId);
  }

  async updateComment(commentId: string, userId: string, content: string) {
    return this.supabase.from('comments').update({ content })
      .eq('id', commentId)
      .eq('user_id', userId);
  }
}
