import { Injectable, inject } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

export type MediaType = 'movie' | 'game';

export interface WatchSession {
  id: string;
  code: string;
  title: string;
  host_id: string;
  host_email: string | null;
  status: 'open' | 'closed';
  closes_at: string | null;
  winner_candidate_id: string | null;
  created_at: string;
}

export interface SessionCandidate {
  id: string;
  session_id: string;
  media_type: MediaType;
  media_id: number;
  title: string;
  image_url: string | null;
  year: number | null;
  added_by: string | null;
  created_at: string;
}

export interface SessionVote {
  id: string;
  session_id: string;
  candidate_id: string;
  user_id: string;
  user_email: string | null;
  created_at: string;
}

/** A candidate with its live tally, ready to render. */
export interface CandidateTally extends SessionCandidate {
  votes: number;
  share: number;        // 0-100, share of votes cast
  votedByMe: boolean;
  voters: string[];     // emails, for the "who picked this" hover
}

// Unambiguous alphabet: no O/0, I/1, S/5 -- codes get read aloud and typed in.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRTUVWXYZ2346789';
const CODE_LENGTH = 6;

@Injectable({ providedIn: 'root' })
export class WatchSessionService {
  private supabase = inject(SupabaseService);

  private get db() {
    return this.supabase.client;
  }

  private generateCode(): string {
    const bytes = new Uint32Array(CODE_LENGTH);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
  }

  // --- Sessions ---------------------------------------------------------------

  /**
   * Creates a session. The share code must be unique, so retry on the (rare)
   * collision rather than trusting a single draw.
   */
  async createSession(
    hostId: string,
    hostEmail: string | null,
    title: string,
    closesAt: string | null
  ): Promise<{ data: WatchSession | null; error: string | null }> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await this.db
        .from('watch_sessions')
        .insert({
          code: this.generateCode(),
          title: title.trim(),
          host_id: hostId,
          host_email: hostEmail,
          closes_at: closesAt
        })
        .select()
        .single();

      if (!error) return { data: data as WatchSession, error: null };

      // 23505 = unique_violation. Only a code clash is worth retrying.
      if (error.code !== '23505') return { data: null, error: error.message };
    }
    return { data: null, error: 'Could not generate a unique session code. Please try again.' };
  }

  async getSessionByCode(code: string): Promise<{ data: WatchSession | null; error: string | null }> {
    const { data, error } = await this.db
      .from('watch_sessions')
      .select('*')
      .eq('code', code.toUpperCase())
      .maybeSingle();

    if (error) {
      // Postgres/PostgREST wording ("relation does not exist", schema cache
      // misses) is noise to a person holding an invite link.
      console.error('Session lookup failed:', error);
      return { data: null, error: 'Could not load that session. Please try again.' };
    }
    if (!data) return { data: null, error: 'No session found with that code.' };
    return { data: data as WatchSession, error: null };
  }

  /** Sessions the user hosts, plus any they have voted in. */
  async getMySessions(userId: string): Promise<WatchSession[]> {
    const [hosted, voted] = await Promise.all([
      this.db.from('watch_sessions').select('*').eq('host_id', userId),
      this.db.from('session_votes').select('session_id').eq('user_id', userId)
    ]);

    const sessions = new Map<string, WatchSession>();
    (hosted.data ?? []).forEach(s => sessions.set(s.id, s as WatchSession));

    const joinedIds = (voted.data ?? [])
      .map(v => v.session_id as string)
      .filter(id => !sessions.has(id));

    if (joinedIds.length > 0) {
      const { data } = await this.db.from('watch_sessions').select('*').in('id', joinedIds);
      (data ?? []).forEach(s => sessions.set(s.id, s as WatchSession));
    }

    return Array.from(sessions.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /** Closes voting and records the winner. Ties resolve to the earliest-added candidate. */
  async closeSession(sessionId: string, winnerCandidateId: string | null) {
    return this.db
      .from('watch_sessions')
      .update({ status: 'closed', winner_candidate_id: winnerCandidateId })
      .eq('id', sessionId);
  }

  async reopenSession(sessionId: string) {
    return this.db
      .from('watch_sessions')
      .update({ status: 'open', winner_candidate_id: null })
      .eq('id', sessionId);
  }

  async deleteSession(sessionId: string) {
    return this.db.from('watch_sessions').delete().eq('id', sessionId);
  }

  // --- Candidates -------------------------------------------------------------

  async getCandidates(sessionId: string): Promise<SessionCandidate[]> {
    const { data } = await this.db
      .from('session_candidates')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    return (data ?? []) as SessionCandidate[];
  }

  async addCandidate(
    sessionId: string,
    userId: string,
    candidate: { media_type: MediaType; media_id: number; title: string; image_url?: string | null; year?: number | null }
  ): Promise<{ error: string | null }> {
    const { error } = await this.db.from('session_candidates').insert({
      session_id: sessionId,
      media_type: candidate.media_type,
      media_id: candidate.media_id,
      title: candidate.title,
      image_url: candidate.image_url ?? null,
      year: candidate.year ?? null,
      added_by: userId
    });

    if (!error) return { error: null };
    if (error.code === '23505') return { error: 'That pick is already on the list.' };
    return { error: error.message };
  }

  async removeCandidate(candidateId: string) {
    return this.db.from('session_candidates').delete().eq('id', candidateId);
  }

  // --- Votes ------------------------------------------------------------------

  async getVotes(sessionId: string): Promise<SessionVote[]> {
    const { data } = await this.db.from('session_votes').select('*').eq('session_id', sessionId);
    return (data ?? []) as SessionVote[];
  }

  /**
   * Casts or moves the user's single vote. UNIQUE(session_id, user_id) makes this
   * an upsert on that pair, so changing your mind never creates a second row.
   */
  async castVote(
    sessionId: string,
    candidateId: string,
    userId: string,
    userEmail: string | null
  ): Promise<{ error: string | null }> {
    const { error } = await this.db
      .from('session_votes')
      .upsert(
        {
          session_id: sessionId,
          candidate_id: candidateId,
          user_id: userId,
          user_email: userEmail
        },
        { onConflict: 'session_id,user_id' }
      );
    return { error: error ? error.message : null };
  }

  async withdrawVote(sessionId: string, userId: string) {
    return this.db.from('session_votes').delete().eq('session_id', sessionId).eq('user_id', userId);
  }

  // --- Tally ------------------------------------------------------------------

  /** Pure projection of candidates + votes into render-ready rows, ranked. */
  buildTally(
    candidates: SessionCandidate[],
    votes: SessionVote[],
    currentUserId: string | null
  ): CandidateTally[] {
    const total = votes.length;

    return candidates
      .map(c => {
        const mine = votes.filter(v => v.candidate_id === c.id);
        return {
          ...c,
          votes: mine.length,
          share: total > 0 ? Math.round((mine.length / total) * 100) : 0,
          votedByMe: !!currentUserId && mine.some(v => v.user_id === currentUserId),
          voters: mine.map(v => v.user_email ?? 'Someone')
        };
      })
      .sort((a, b) => {
        if (b.votes !== a.votes) return b.votes - a.votes;
        // Stable tiebreak: whoever was suggested first stays first, which is also
        // the rule closeSession() uses to pick a winner.
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
  }

  // --- Realtime ---------------------------------------------------------------

  /** Live updates for one session. Caller must unsubscribe via unsubscribe(). */
  subscribeToSession(sessionId: string, onChange: () => void): RealtimeChannel {
    return this.db
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_votes', filter: `session_id=eq.${sessionId}` },
        () => onChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_candidates', filter: `session_id=eq.${sessionId}` },
        () => onChange()
      )
      .subscribe();
  }

  async unsubscribe(channel: RealtimeChannel) {
    await this.db.removeChannel(channel);
  }
}
