import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, map, startWith, Subject, takeUntil } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';

interface MediaItem {
  id: number;
  tmdb_id?: number;  // TMDB movie ID
  title?: string;
  name?: string;
  year?: number;
  released?: string;
  poster_url?: string;
  backdrop_url?: string;
  background_image?: string;
  imdb_rating?: number;
  vote_average?: number;
  rating?: number;
  metacritic?: number;
  genres?: string[];
  overview?: string;
  runtime?: number;
  tagline?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass']
})
export class HomeComponent implements OnInit, OnDestroy {
  private supabase = inject(SupabaseService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  movies = signal<MediaItem[]>([]);
  games = signal<MediaItem[]>([]);
  movieGenres = signal<string[]>([]);
  gameGenres = signal<string[]>([]);
  
  selectedGenre = signal<string | null>(null);
  searchQuery = signal<string>('');
  loading = signal<boolean>(true);
  activeTab = signal<number>(0);

  // Featured item for the hero banner
  featuredMovie = computed(() => {
    const items = this.movies();
    if (items.length === 0) return null;
    // Pick a highly-rated movie for the hero (use vote_average for TMDB or imdb_rating fallback)
    const rated = items.filter(m => {
      const rating = m.vote_average ?? m.imdb_rating;
      const hasImage = m.poster_url || m.backdrop_url;
      return rating !== undefined && rating >= 7 && hasImage;
    });
    if (rated.length > 0) return rated[Math.floor(Math.random() * Math.min(rated.length, 5))];
    return items[0];
  });

  featuredGame = computed(() => {
    const items = this.games();
    if (items.length === 0) return null;
    const rated = items.filter(g => g.metacritic && g.metacritic >= 75 && g.background_image);
    if (rated.length > 0) return rated[Math.floor(Math.random() * Math.min(rated.length, 5))];
    return items[0];
  });

  myControl = new FormControl();
  filteredOptions!: Observable<MediaItem[]>;

  get currentItems(): MediaItem[] {
    return this.activeTab() === 0 ? this.movies() : this.games();
  }

  ngOnInit(): void {
    this.loadGenres();
    this.loadData();
    
    this.filteredOptions = this.myControl.valueChanges.pipe(
      startWith(''),
      map(value => (typeof value === 'string' ? value : value?.title || value?.name || '')),
      map(name => name ? this._filter(name) : this.currentItems.slice(0, 10))
    );

    this.activatedRoute.params.pipe(takeUntil(this.destroy$)).subscribe((params: Params) => {
      if (params['movie-search']) {
        this.searchQuery.set(params['movie-search']);
        this.searchMedia(params['movie-search']);
        this.activeTab.set(0);
      }
    });
  }

  async loadGenres() {
    try {
      const [movieGenresData, gameGenresData] = await Promise.all([
        this.supabase.getGenres(),
        this.supabase.getGameGenres()
      ]);
      
      if (movieGenresData.data) {
        this.movieGenres.set(movieGenresData.data.map(g => g.name));
      }
      if (gameGenresData.data) {
        this.gameGenres.set(gameGenresData.data.map(g => g.name));
      }
    } catch (err) {
      console.error('Error loading genres:', err);
    }
  }

  async loadData() {
    this.loading.set(true);
    
    try {
      const [moviesData, gamesData] = await Promise.all([
        this.supabase.getMovies(),
        this.supabase.getGames()
      ]);
      
      if (moviesData.data) {
        this.movies.set(moviesData.data);
      }
      if (gamesData.data) {
        this.games.set(gamesData.data);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
    
    this.loading.set(false);
  }

  async filterByGenre(genre: string) {
    this.loading.set(true);
    this.selectedGenre.set(genre);
    
    if (this.activeTab() === 0) {
      const result = await this.supabase.getMoviesByGenre(genre);
      this.movies.set(result.data || []);
    } else {
      const result = await this.supabase.getGamesByGenre(genre);
      this.games.set(result.data || []);
    }
    
    this.loading.set(false);
  }

  async searchMedia(query: string) {
    if (!query.trim()) {
      await this.loadData();
      return;
    }
    
    this.loading.set(true);
    this.searchQuery.set(query);
    
    if (this.activeTab() === 0) {
      const result = await this.supabase.searchMovies(query);
      this.movies.set(result.data || []);
    } else {
      const result = await this.supabase.searchGames(query);
      this.games.set(result.data || []);
    }
    
    this.loading.set(false);
  }

  onTabChange(index: number): void {
    this.activeTab.set(index);
    this.selectedGenre.set(null);
    this.myControl.setValue('');
  }

  displayFn(item: MediaItem): string {
    return item?.title || item?.name || '';
  }

  private _filter(value: string): MediaItem[] {
    const filterValue = value.toLowerCase();
    return this.currentItems.filter(item => 
      (item.title || item.name || '').toLowerCase().includes(filterValue)
    ).slice(0, 10);
  }

  openDetails(id: number): void {
    const type = this.activeTab() === 0 ? 'movie' : 'game';
    this.router.navigate(['details', type, id]);
  }

  // Helper to get the correct ID for navigation (tmdb_id for movies, id for games)
  getMediaId(item: MediaItem): number {
    return item.tmdb_id ?? item.id;
  }

  // Helper to get rating (vote_average for TMDB, imdb_rating fallback)
  getRating(item: MediaItem): number | undefined {
    return item.vote_average ?? item.imdb_rating;
  }

  // Helper to get hero image (backdrop_url for movies, background_image for games)
  getHeroImage(item: MediaItem): string | undefined {
    return item.backdrop_url ?? item.background_image ?? item.poster_url;
  }

  openFeaturedDetails(): void {
    const featured = this.activeTab() === 0 ? this.featuredMovie() : this.featuredGame();
    if (featured) {
      const type = this.activeTab() === 0 ? 'movie' : 'game';
      const id = this.getMediaId(featured);
      this.router.navigate(['details', type, id]);
    }
  }

  clearFilter(): void {
    this.selectedGenre.set(null);
    this.searchQuery.set('');
    this.loadData();
  }

  getRatingColor(value: number): string {
    if (value >= 75) return '#46d369';
    if (value >= 50) return '#ffc107';
    if (value >= 30) return '#f7aa38';
    return '#ef4655';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/no-image.png';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
