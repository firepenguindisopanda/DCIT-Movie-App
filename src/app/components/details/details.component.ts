import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GaugeModule } from 'angular-gauge';
import { Subject, takeUntil } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';

interface MediaDetail {
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
  rt_score?: number;
  worldwide_gross?: string;
  studio?: string;
  length?: number;
  genres?: string[];
  platforms?: string[];
}

interface Comment {
  id: string;
  user_email: string;
  content: string;
  created_at: string;
}

@Component({
  selector: 'app-details',
  standalone: true,
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
    GaugeModule
  ],
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.sass']
})
export class DetailsComponent implements OnInit, OnDestroy {
  private supabase = inject(SupabaseService);
  readonly authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  mediaType = signal<'movie' | 'game'>('movie');
  mediaId = signal<number>(0);
  media = signal<MediaDetail | null>(null);
  loading = signal<boolean>(true);
  isFavorite = signal<boolean>(false);
  
  comments = signal<Comment[]>([]);
  newComment = signal<string>('');
  submittingComment = signal<boolean>(false);

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get currentUserId(): string | null {
    return this.authService.user()?.id || null;
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
    
    try {
      let result;
      if (this.mediaType() === 'movie') {
        result = await this.supabase.getMovieById(this.mediaId());
        if (result.data) {
          this.media.set(result.data as MediaDetail);
        }
      } else {
        result = await this.supabase.getGameById(this.mediaId());
        if (result.data) {
          this.media.set(result.data as MediaDetail);
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
    return m.metacritic || m.imdb_rating ? (m.imdb_rating || 0) * 10 : 0;
  }

  getColor(value: number): string {
    if (value >= 75) return '#5ee432';
    if (value >= 50) return '#ffa50';
    if (value >= 30) return '#f7aa38';
    return '#ef4655';
  }

  getColorForGauge(): (value: number) => string {
    return (value: number) => this.getColor(value);
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
