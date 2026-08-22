import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GaugeModule } from 'angular-gauge';
import { Subject, takeUntil } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';
import { HttpService } from '../../services/http.service';
import { TmdbService, TMDBCast, TMDBCrew } from '../../services/tmdb.service';
import { AuthService } from '../../services/auth.service';

interface MediaDetail {
  id: number;
  tmdb_id?: number;
  rawg_id?: number;
  title?: string;
  name?: string;
  year?: number;
  released?: string;
  release_date?: string;
  poster_url?: string;
  backdrop_url?: string;
  background_image?: string;
  overview?: string;
  imdb_rating?: number;
  vote_average?: number;
  vote_count?: number;
  rating?: number;
  metacritic?: number;
  // Removed: rt_score, worldwide_gross, studio (not available from TMDB)
  runtime?: number;
  tagline?: string;
  budget?: number;
  revenue?: number;
  status?: string;
  genres?: string[];
  platforms?: string[];
  
  // Game-specific fields from RAWG
  description?: string;
  website?: string;
  developers?: string[];
  publishers?: string[];
  screenshots?: GameScreenshot[];
  trailers?: GameTrailer[];

  // Movie-specific fields from TMDB
  cast?: TMDBCast[];
  crew?: TMDBCrew[];
}

interface GameScreenshot {
  image: string;
}

interface GameTrailer {
  id: number;
  name: string;
  preview: string;
  data: {
    max: string;
  };
}

interface Comment {
  id: string;
  user_email: string;
  content: string;
  created_at: string;
}

@Component({
    selector: 'app-details',
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        GaugeModule
    ],
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.sass']
})
export class DetailsComponent implements OnInit, OnDestroy {
  private supabase = inject(SupabaseService);
  private httpService = inject(HttpService);
  private tmdbService = inject(TmdbService);
  readonly authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private destroy$ = new Subject<void>();

  mediaType = signal<'movie' | 'game'>('movie');
  mediaId = signal<number>(0);
  media = signal<MediaDetail | null>(null);
  loading = signal<boolean>(true);
  isFavorite = signal<boolean>(false);
  
  comments = signal<Comment[]>([]);
  newComment = signal<string>('');
  submittingComment = signal<boolean>(false);
  playingTrailerId = signal<number | null>(null);

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get currentUserId(): string | null {
    return this.authService.user()?.id || null;
  }

  get isMovie(): boolean {
    return this.mediaType() === 'movie';
  }

  goBack(): void {
    this.location.back();
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params: Params) => {
      this.mediaType.set(params['type'] as 'movie' | 'game');
      this.mediaId.set(+params['id']);
      this.loadMedia();
      this.loadComments();
    });
  }

  async loadMedia(): Promise<void> {
    this.loading.set(true);

    // Route params can change without Angular recreating the component, and the
    // branches below only assign on success. Without clearing first, navigating
    // to a missing id would keep rendering the previous title under the new id
    // (with the new id's comments beneath it) and the not-found state would
    // never show.
    this.media.set(null);
    this.isFavorite.set(false);
    this.playingTrailerId.set(null);

    try {
      let result;
      if (this.mediaType() === 'movie') {
        result = await this.supabase.getMovieById(this.mediaId());
        if (result.data) {
          const movieData = result.data as MediaDetail;
          
          // Fetch cast & crew from TMDB
          try {
            const tmdbCredits = await this.tmdbService.getMovieCredits(this.mediaId()).toPromise();
            if (tmdbCredits) {
              this.media.set({
                ...movieData,
                cast: tmdbCredits.cast,
                crew: tmdbCredits.crew
              } as MediaDetail);
            } else {
              this.media.set(movieData);
            }
          } catch (tmdbError) {
            console.error('Error loading TMDB credits:', tmdbError);
            this.media.set(movieData);
          }
        }
      } else {
        // For games, fetch from Supabase first, then enrich with RAWG API data
        result = await this.supabase.getGameById(this.mediaId());
        if (result.data) {
          const gameData = result.data as MediaDetail;
          
          // Fetch additional details from RAWG API.
          // NOTE: the route id is the Supabase row id, which is NOT the RAWG id.
          // Always enrich using gameData.rawg_id or we render another game's data.
          try {
            const rawgId = gameData.rawg_id;
            const rawgResult = rawgId
              ? await this.httpService.getGameDetails(rawgId.toString()).toPromise()
              : null;
            if (rawgResult) {
              // Merge RAWG data into game data
              this.media.set({
                ...gameData,
                description: (rawgResult as any).description,
                website: (rawgResult as any).website,
                developers: (rawgResult as any).developers?.map((d: any) => d.name),
                publishers: (rawgResult as any).publishers?.map((p: any) => p.name),
                screenshots: (rawgResult as any).screenshots,
                trailers: (rawgResult as any).trailers
              } as MediaDetail);
            } else {
              this.media.set(gameData);
            }
          } catch (rawgError) {
            console.error('Error loading RAWG data:', rawgError);
            // Use basic game data if RAWG fails
            this.media.set(gameData);
          }
        }
      }

      // Check if favorited
      if (this.isAuthenticated) {
        const favResult = await this.supabase.checkIsFavorite(
          this.currentUserId!,
          this.mediaType(),
          this.mediaId()
        );
        this.isFavorite.set(!!favResult.data);
      }
    } catch (error) {
      console.error('Error loading media:', error);
    }
    
    this.loading.set(false);
  }

  async loadComments(): Promise<void> {
    const result = await this.supabase.getComments(this.mediaType(), this.mediaId());
    if (result.data) {
      this.comments.set(result.data as Comment[]);
    }
  }

  async toggleFavorite(): Promise<void> {
    if (!this.isAuthenticated) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/details/${this.mediaType()}/${this.mediaId()}` } });
      return;
    }

    // Favourites key off the route id alone, so without this an unknown id could
    // be saved and would then show up in My List as an unopenable entry.
    if (!this.media()) return;

    try {
      if (this.isFavorite()) {
        await this.supabase.removeFavorite(this.currentUserId!, this.mediaType(), this.mediaId());
        this.isFavorite.set(false);
      } else {
        await this.supabase.addFavorite(this.currentUserId!, this.mediaType(), this.mediaId());
        this.isFavorite.set(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }

  async submitComment(): Promise<void> {
    if (!this.newComment().trim() || !this.isAuthenticated) return;

    this.submittingComment.set(true);
    
    try {
      await this.supabase.addComment(
        this.currentUserId!,
        this.authService.userEmail()!,
        this.mediaType(),
        this.mediaId(),
        this.newComment()
      );
      
      this.newComment.set('');
      await this.loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
    
    this.submittingComment.set(false);
  }

  async deleteComment(commentId: string): Promise<void> {
    if (!this.currentUserId) return;

    try {
      await this.supabase.deleteComment(commentId, this.currentUserId);
      await this.loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  }

  getRating(): number {
    const m = this.media();
    if (!m) return 0;
    // For games, prefer metacritic
    if (m.metacritic) return m.metacritic;
    // For movies, use vote_average (TMDB) or imdb_rating fallback
    if (m.vote_average) return m.vote_average * 10;
    if (m.imdb_rating) return m.imdb_rating * 10;
    return 0;
  }

  getRatingLabel(): string {
    const m = this.media();
    if (!m) return '';
    // For games with metacritic score
    if (m.metacritic) {
      if (m.metacritic >= 75) return 'Excellent';
      if (m.metacritic >= 50) return 'Good';
      if (m.metacritic >= 30) return 'Mixed';
      return 'Poor';
    }
    // For movies with vote_average
    const rating = m.vote_average ?? m.imdb_rating ?? 0;
    if (rating >= 7) return 'Excellent';
    if (rating >= 5) return 'Good';
    if (rating >= 3) return 'Mixed';
    return 'Poor';
  }

  getColor(value: number): string {
    if (value >= 75) return '#46d369';
    if (value >= 50) return '#ffc107';
    if (value >= 30) return '#f7aa38';
    return '#ef4655';
  }

  // getColor() stays vivid for gauges and score bars, where saturation reads well.
  // Text needs darker variants to clear WCAG AA against the light surface.
  getTextColor(value: number): string {
    if (value >= 75) return '#157347';
    if (value >= 50) return '#9A6700';
    if (value >= 30) return '#B45309';
    return '#C8102E';
  }

  getColorForGauge(): (value: number) => string {
    return (value: number) => this.getColor(value);
  }

  // Get key crew members (Director, Producer, Writer, etc.)
  getKeyCrew(): any[] {
    const crew = this.media()?.crew || [];
    const keyJobs = ['Director', 'Producer', 'Screenplay', 'Writer', 'Story', 'Executive Producer'];
    
    const keyCrew = crew
      .filter((c: any) => keyJobs.includes(c.job))
      .slice(0, 8);
    
    // Remove duplicates by name+job
    const seen = new Set();
    return keyCrew.filter((c: any) => {
      const key = `${c.name}-${c.job}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  getPlatformIcon(platform: string): string {
    const p = platform.toLowerCase();
    if (p.includes('pc') || p.includes('windows')) return 'computer';
    if (p.includes('playstation')) return 'sports_esports';
    if (p.includes('xbox')) return 'gamepad';
    if (p.includes('nintendo') || p.includes('switch')) return 'videogame_asset';
    if (p.includes('ios') || p.includes('android') || p.includes('mobile')) return 'phone_iphone';
    if (p.includes('linux')) return 'terminal';
    if (p.includes('mac')) return 'laptop_mac';
    return 'devices';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
