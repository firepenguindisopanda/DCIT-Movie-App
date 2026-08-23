import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, map, startWith, Subject, takeUntil } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';
import { DoubleFeatureToggleComponent } from '../../shared/double-feature-toggle.component';

interface MediaItem {
  id: number;
  tmdb_id?: number;
  title?: string;
  name?: string;
  year?: number;
  released?: string;
  poster_url?: string;
  backdrop_url?: string;
  background_image?: string;
  imdb_rating?: number;
  vote_average?: number;
  popularity?: number;
  rating?: number;
  metacritic?: number;
  genres?: string[];
  overview?: string;
  runtime?: number;
  tagline?: string;
}

@Component({
    selector: 'app-home',
    imports: [
        CommonModule,
        RouterLink,
        ReactiveFormsModule,
        FormsModule,
        DoubleFeatureToggleComponent,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
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

  sortBy = signal<'popularity' | 'rating' | 'release_date' | 'title'>('popularity');

  /**
   * The catalog is ~950 movies and ~2000 games. Rendering every card at once
   * produced a 75,000px page and thousands of DOM nodes, so the grid grows in
   * pages instead. Counts are per-tab so switching tabs preserves your place.
   */
  readonly pageSize = 60;
  visibleMovieCount = signal<number>(60);
  visibleGameCount = signal<number>(60);
  yearFrom = signal<number | null>(null);
  yearTo = signal<number | null>(null);
  minRating = signal<number | null>(null);

  filteredMovies = computed(() => {
    let items = this.movies();
    const minR = this.minRating();
    const yFrom = this.yearFrom();
    const yTo = this.yearTo();
    const sort = this.sortBy();

    if (minR !== null) {
      items = items.filter(m => (m.vote_average ?? 0) >= minR);
    }
    if (yFrom !== null) {
      items = items.filter(m => m.year !== undefined && m.year !== null && m.year >= yFrom);
    }
    if (yTo !== null) {
      items = items.filter(m => m.year !== undefined && m.year !== null && m.year <= yTo);
    }

    return [...items].sort((a, b) => {
      switch (sort) {
        case 'rating':
          return (b.vote_average ?? 0) - (a.vote_average ?? 0);
        case 'release_date':
          return (b.year ?? 0) - (a.year ?? 0);
        case 'title':
          return (a.title ?? '').localeCompare(b.title ?? '');
        default:
          return (b.popularity ?? 0) - (a.popularity ?? 0);
      }
    });
  });

  filteredGames = computed(() => {
    let items = this.games();
    const minR = this.minRating();
    const yFrom = this.yearFrom();
    const yTo = this.yearTo();
    const sort = this.sortBy();

    if (minR !== null) {
      items = items.filter(g => (g.metacritic ?? 0) >= minR);
    }
    if (yFrom !== null) {
      items = items.filter(g => {
        if (!g.released) return false;
        const year = new Date(g.released).getFullYear();
        return !isNaN(year) && year >= yFrom;
      });
    }
    if (yTo !== null) {
      items = items.filter(g => {
        if (!g.released) return false;
        const year = new Date(g.released).getFullYear();
        return !isNaN(year) && year <= yTo;
      });
    }

    return [...items].sort((a, b) => {
      switch (sort) {
        case 'rating':
          return (b.metacritic ?? 0) - (a.metacritic ?? 0);
        case 'release_date': {
          const yearA = a.released ? new Date(a.released).getFullYear() : 0;
          const yearB = b.released ? new Date(b.released).getFullYear() : 0;
          return yearB - yearA;
        }
        case 'title':
          return (a.name ?? '').localeCompare(b.name ?? '');
        default:
          return (b.popularity ?? b.metacritic ?? 0) - (a.popularity ?? a.metacritic ?? 0);
      }
    });
  });

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

  // What the grid actually renders.
  pagedMovies = computed(() => this.filteredMovies().slice(0, this.visibleMovieCount()));
  pagedGames = computed(() => this.filteredGames().slice(0, this.visibleGameCount()));

  totalInTab = computed(() =>
    this.activeTab() === 0 ? this.filteredMovies().length : this.filteredGames().length
  );
  shownInTab = computed(() =>
    this.activeTab() === 0 ? this.pagedMovies().length : this.pagedGames().length
  );
  hasMore = computed(() => this.shownInTab() < this.totalInTab());

  // The template drives these through setters rather than signal.set() so that
  // re-sorting or re-filtering also restarts paging.
  setSortBy(value: 'popularity' | 'rating' | 'release_date' | 'title'): void {
    this.sortBy.set(value);
    this.resetPaging();
  }

  setYearFrom(value: number | null): void {
    this.yearFrom.set(value);
    this.resetPaging();
  }

  setYearTo(value: number | null): void {
    this.yearTo.set(value);
    this.resetPaging();
  }

  setMinRating(value: number | null): void {
    this.minRating.set(value);
    this.resetPaging();
  }

  /**
   * Cards fade in staggered by index. Uncapped, a card at index 200 would wait
   * 8 seconds to appear; the delay is only decorative, so cap it at one page's
   * worth and let anything beyond that show immediately.
   */
  staggerDelay(index: number): string {
    return `${Math.min(index, 24) * 0.04}s`;
  }

  showMore(): void {
    if (this.activeTab() === 0) {
      this.visibleMovieCount.update(n => n + this.pageSize);
    } else {
      this.visibleGameCount.update(n => n + this.pageSize);
    }
  }

  /** Any change to the result set restarts paging, or you'd page into stale offsets. */
  private resetPaging(): void {
    this.visibleMovieCount.set(this.pageSize);
    this.visibleGameCount.set(this.pageSize);
  }

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
    this.resetPaging();
    
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
    this.resetPaging();
    
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
    this.resetPaging();
    
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
    this.resetPaging();
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
    this.sortBy.set('popularity');
    this.yearFrom.set(null);
    this.yearTo.set(null);
    this.minRating.set(null);
    this.loadData();
    this.resetPaging();
  }

  onFilterChange(): void {
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

  parseNum(value: string): number | null {
    const n = Number(value);
    return isNaN(n) ? null : n;
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
