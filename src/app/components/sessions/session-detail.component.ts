import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';
import {
  WatchSessionService,
  WatchSession,
  SessionCandidate,
  SessionVote,
  CandidateTally,
  MediaType
} from '../../services/watch-session.service';
import { CrossMediaService, CrossMediaMatch, MOOD_LABELS, Mood } from '../../services/cross-media.service';

interface SearchResult {
  media_type: MediaType;
  media_id: number;
  title: string;
  image_url: string | null;
  year: number | null;
  genres: string[];
}

@Component({
    selector: 'app-session-detail',
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
    ],
    templateUrl: './session-detail.component.html',
    styleUrls: ['./session-detail.component.scss']
})
export class SessionDetailComponent implements OnInit, OnDestroy {
  private sessionsService = inject(WatchSessionService);
  private crossMedia = inject(CrossMediaService);
  private supabase = inject(SupabaseService);
  readonly auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  private channel: RealtimeChannel | null = null;

  session = signal<WatchSession | null>(null);
  candidates = signal<SessionCandidate[]>([]);
  votes = signal<SessionVote[]>([]);
  loading = signal<boolean>(true);
  loadError = signal<string | null>(null);
  actionError = signal<string | null>(null);
  copied = signal<boolean>(false);

  // Add-a-pick panel
  pickerOpen = signal<boolean>(false);
  searchTab = signal<MediaType>('movie');
  searchQuery = signal<string>('');
  searching = signal<boolean>(false);
  searchResults = signal<SearchResult[]>([]);

  suggestions = signal<CrossMediaMatch[]>([]);
  loadingSuggestions = signal<boolean>(false);

  readonly moodLabels = MOOD_LABELS;

  tally = computed<CandidateTally[]>(() =>
    this.sessionsService.buildTally(this.candidates(), this.votes(), this.auth.user()?.id ?? null)
  );

  totalVotes = computed(() => this.votes().length);

  isHost = computed(() => {
    const s = this.session();
    return !!s && s.host_id === this.auth.user()?.id;
  });

  isOpen = computed(() => this.session()?.status === 'open');

  winner = computed(() => {
    const s = this.session();
    if (!s?.winner_candidate_id) return null;
    return this.tally().find(c => c.id === s.winner_candidate_id) ?? null;
  });

  /** Leader while voting is live -- shown as "currently ahead", not as a result. */
  leader = computed(() => {
    const ranked = this.tally();
    if (ranked.length === 0 || this.totalVotes() === 0) return null;
    return ranked[0];
  });

  isTied = computed(() => {
    const ranked = this.tally();
    return ranked.length > 1 && ranked[0].votes > 0 && ranked[0].votes === ranked[1].votes;
  });

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.loadSession(params['code']);
    });
  }

  async loadSession(code: string): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);

    const { data, error } = await this.sessionsService.getSessionByCode(code);
    if (error || !data) {
      this.loadError.set(error ?? 'Session not found.');
      this.loading.set(false);
      return;
    }

    this.session.set(data);
    await this.refresh();
    this.loading.set(false);

    // Live tally: re-pull on any vote or candidate change in this session.
    if (this.channel) await this.sessionsService.unsubscribe(this.channel);
    this.channel = this.sessionsService.subscribeToSession(
      data.id,
      () => this.refresh(),
      // Host closed or reopened the vote: reflect it without a page reload.
      updated => this.session.set(updated)
    );

    this.loadSuggestions();
  }

  async refresh(): Promise<void> {
    const s = this.session();
    if (!s) return;
    const [candidates, votes] = await Promise.all([
      this.sessionsService.getCandidates(s.id),
      this.sessionsService.getVotes(s.id)
    ]);
    this.candidates.set(candidates);
    this.votes.set(votes);
  }

  // --- Voting -----------------------------------------------------------------

  async vote(candidate: CandidateTally): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/sessions/${this.session()!.code}` }
      });
      return;
    }
    if (!this.isOpen()) return;

    this.actionError.set(null);
    const user = this.auth.user()!;
    const s = this.session()!;

    // Clicking your existing pick withdraws it, so you can abstain again.
    const { error } = candidate.votedByMe
      ? await this.sessionsService
          .withdrawVote(s.id, user.id)
          .then(r => ({ error: r.error ? r.error.message : null }))
      : await this.sessionsService.castVote(s.id, candidate.id, user.id, user.email ?? null);

    if (error) {
      this.actionError.set(error);
      return;
    }
    await this.refresh();
  }

  // --- Host controls ----------------------------------------------------------

  async closeVoting(): Promise<void> {
    const s = this.session();
    if (!s || !this.isHost()) return;

    // buildTally already ranks by votes, then by who was suggested first, so the
    // top row is the winner under the same tiebreak the UI has been showing.
    const ranked = this.tally();
    const winnerId = ranked.length > 0 && ranked[0].votes > 0 ? ranked[0].id : null;

    const { error } = await this.sessionsService.closeSession(s.id, winnerId);
    if (error) {
      this.actionError.set(error.message);
      return;
    }
    this.session.set({ ...s, status: 'closed', winner_candidate_id: winnerId });
  }

  async reopenVoting(): Promise<void> {
    const s = this.session();
    if (!s || !this.isHost()) return;

    const { error } = await this.sessionsService.reopenSession(s.id);
    if (error) {
      this.actionError.set(error.message);
      return;
    }
    this.session.set({ ...s, status: 'open', winner_candidate_id: null });
  }

  async removeCandidate(candidate: CandidateTally, event: Event): Promise<void> {
    event.stopPropagation();
    const { error } = await this.sessionsService.removeCandidate(candidate.id);
    if (error) {
      this.actionError.set(error.message);
      return;
    }
    await this.refresh();
    this.loadSuggestions();
  }

  canRemove(candidate: CandidateTally): boolean {
    const userId = this.auth.user()?.id;
    return this.isOpen() && (!!userId && candidate.added_by === userId || this.isHost());
  }

  async copyCode(): Promise<void> {
    const s = this.session();
    if (!s) return;
    try {
      await navigator.clipboard.writeText(`${location.origin}/sessions/${s.code}`);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.actionError.set('Could not copy automatically - the code is shown above.');
    }
  }

  // --- Adding picks -----------------------------------------------------------

  togglePicker(): void {
    this.pickerOpen.update(v => !v);
  }

  setSearchTab(type: MediaType): void {
    this.searchTab.set(type);
    this.searchResults.set([]);
    if (this.searchQuery().trim()) this.search();
  }

  async search(): Promise<void> {
    const query = this.searchQuery().trim();
    if (!query) {
      this.searchResults.set([]);
      return;
    }

    this.searching.set(true);
    const type = this.searchTab();

    if (type === 'movie') {
      const { data } = await this.supabase.searchMovies(query);
      this.searchResults.set(
        (data ?? []).slice(0, 12).map((m: any) => ({
          media_type: 'movie' as MediaType,
          media_id: m.tmdb_id,
          title: m.title,
          image_url: m.poster_url ?? null,
          year: m.year ?? null,
          genres: m.genres ?? []
        }))
      );
    } else {
      const { data } = await this.supabase.searchGames(query);
      this.searchResults.set(
        (data ?? []).slice(0, 12).map((g: any) => ({
          media_type: 'game' as MediaType,
          media_id: g.id,
          title: g.name,
          image_url: g.background_image ?? null,
          year: g.released ? new Date(g.released).getFullYear() : null,
          genres: g.genres ?? []
        }))
      );
    }

    this.searching.set(false);
  }

  async addPick(item: { media_type: MediaType; media_id: number; title: string; image_url: string | null; year: number | null }): Promise<void> {
    const s = this.session();
    const user = this.auth.user();
    if (!s || !user) return;

    this.actionError.set(null);
    const { error } = await this.sessionsService.addCandidate(s.id, user.id, item);
    if (error) {
      this.actionError.set(error);
      return;
    }

    this.searchQuery.set('');
    this.searchResults.set([]);
    await this.refresh();
    this.loadSuggestions();
  }

  alreadyAdded(mediaType: MediaType, mediaId: number): boolean {
    return this.candidates().some(c => c.media_type === mediaType && c.media_id === mediaId);
  }

  // --- Cross-media suggestions ------------------------------------------------

  /**
   * "You've got two action films on the list -- here are games that hit the same
   * note." Seeds from what is already up for vote, and suggests the other medium.
   */
  async loadSuggestions(): Promise<void> {
    const current = this.candidates();
    if (current.length === 0) {
      this.suggestions.set([]);
      return;
    }

    this.loadingSuggestions.set(true);

    // Candidates store only denormalized display fields, so fetch genres for the
    // seeds from whichever catalog each one came from.
    const seeds = await Promise.all(
      current.slice(0, 4).map(async c => {
        const result = c.media_type === 'movie'
          ? await this.supabase.getMovieById(c.media_id)
          : await this.supabase.getGameById(c.media_id);
        const genres = (result.data as any)?.genres ?? [];
        return { type: c.media_type, genres } as { type: MediaType; genres: string[] };
      })
    );

    const usable = seeds.filter(s => s.genres.length > 0);
    const matches = await this.crossMedia.suggestForSession(
      current.map(c => ({ media_type: c.media_type, media_id: c.media_id })),
      usable,
      6
    );

    this.suggestions.set(matches);
    this.loadingSuggestions.set(false);
  }

  moodLabel(mood: Mood): string {
    return MOOD_LABELS[mood];
  }

  detailLink(item: { media_type: MediaType; media_id: number }): string[] {
    return ['/details', item.media_type, String(item.media_id)];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.channel) this.sessionsService.unsubscribe(this.channel);
  }
}
