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
          persistSession: false, // Disable to avoid Navigator LockManager error
          autoRefreshToken: false,
          detectSessionInUrl: false
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
  async getMovies() {
    return this.supabase.from('movies').select('*');
  }

  async getMovieById(id: number) {
    return this.supabase.from('movies').select('*').eq('id', id).single();
  }

  async getMoviesByGenre(genre: string) {
    return this.supabase.from('movies').select('*').contains('genres', [genre]);
  }

  async searchMovies(query: string) {
    return this.supabase.from('movies').select('*').ilike('title', `%${query}%`);
  }

  async getGenres() {
    return this.supabase.from('genres').select('*').order('name');
  }
  async getGames() {
    return this.supabase.from('games').select('*');
  }

  async getGameById(id: number) {
    return this.supabase.from('games').select('*').eq('id', id).single();
  }

  async getGamesByGenre(genre: string) {
    return this.supabase.from('games').select('*').contains('genres', [genre]);
  }

  async searchGames(query: string) {
    return this.supabase.from('games').select('*').ilike('name', `%${query}%`);
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
