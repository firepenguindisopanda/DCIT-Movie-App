import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject, takeUntil } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';

interface FavoriteItem {
  id: string;
  media_type: 'movie' | 'game';
  media_id: number;
  created_at: string;
  movie?: any;
  game?: any;
}

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule
  ],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss']
})
export class FavoritesComponent implements OnInit, OnDestroy {
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  movieFavorites = signal<FavoriteItem[]>([]);
  gameFavorites = signal<FavoriteItem[]>([]);
  loading = signal<boolean>(true);
  activeTab = signal<number>(0);

  async ngOnInit(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    await this.loadFavorites();
  }

  async loadFavorites(): Promise<void> {
    this.loading.set(true);
    
    try {
      const userId = this.authService.user()?.id;
      if (!userId) return;

      const result = await this.supabase.getUserFavorites(userId);
      if (!result.data) {
        this.loading.set(false);
        return;
      }

      const favorites = result.data as FavoriteItem[];
      
      // Separate movies and games
      const movieFavs = favorites.filter(f => f.media_type === 'movie');
      const gameFavs = favorites.filter(f => f.media_type === 'game');

      // Load media details for each favorite
      const movieDetails = await Promise.all(
        movieFavs.map(f => this.supabase.getMovieById(f.media_id))
      );
      
      const gameDetails = await Promise.all(
        gameFavs.map(f => this.supabase.getGameById(f.media_id))
      );

      this.movieFavorites.set(
        movieFavs.map((f, i) => ({
          ...f,
          movie: movieDetails[i].data
        }))
      );

      this.gameFavorites.set(
        gameFavs.map((f, i) => ({
          ...f,
          game: gameDetails[i].data
        }))
      );
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
    
    this.loading.set(false);
  }

  async removeFavorite(favorite: FavoriteItem): Promise<void> {
    try {
      const userId = this.authService.user()?.id;
      if (!userId) return;

      await this.supabase.removeFavorite(userId, favorite.media_type, favorite.media_id);
      await this.loadFavorites();
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  }

  onTabChange(index: number): void {
    this.activeTab.set(index);
  }

  getRatingColor(value: number): string {
    if (value >= 75) return '#5ee432';
    if (value >= 50) return '#ffa50';
    if (value >= 30) return '#f7aa38';
    return '#ef4655';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
