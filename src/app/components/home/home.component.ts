import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
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
  title?: string;
  name?: string;
  year?: number;
  released?: string;
  poster_url?: string;
  background_image?: string;
  imdb_rating?: number;
  rating?: number;
  metacritic?: number;
  genres?: string[];
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
      map(name => name ? this._filter(name) : this.currentItems.slice())
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
    console.log('Loading genres from Supabase...');
    try {
      const [movieGenresData, gameGenresData] = await Promise.all([
        this.supabase.getGenres(),
        this.supabase.getGameGenres()
      ]);
      
      console.log('Movie genres:', movieGenresData);
      console.log('Game genres:', gameGenresData);
      
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
    console.log('Loading movies and games from Supabase...');
    
    try {
      const [moviesData, gamesData] = await Promise.all([
        this.supabase.getMovies(),
        this.supabase.getGames()
      ]);
      
      console.log('Movies response:', moviesData);
      console.log('Games response:', gamesData);
      console.log('First movie:', moviesData.data?.[0]);
      console.log('First game:', gamesData.data?.[0]);
      
      if (moviesData.data) {
        this.movies.set(moviesData.data);
        console.log('Movies loaded:', moviesData.data.length);
      }
      if (gamesData.data) {
        this.games.set(gamesData.data);
        console.log('Games loaded:', gamesData.data.length);
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
    );
  }

  openDetails(id: number): void {
    const type = this.activeTab() === 0 ? 'movie' : 'game';
    this.router.navigate(['details', type, id]);
  }

  clearFilter(): void {
    this.selectedGenre.set(null);
    this.searchQuery.set('');
    this.loadData();
  }

  getRatingColor(value: number): string {
    if (value >= 75) return '#5ee432';
    if (value >= 50) return '#ffa50';
    if (value >= 30) return '#f7aa38';
    return '#ef4655';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://via.placeholder.com/300x450?text=No+Image';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
