import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { MediaType } from './watch-session.service';

/**
 * Cross-media matching.
 *
 * TMDB and RAWG genres do not describe the same thing. TMDB is thematic (what a
 * film is *about*: Crime, Romance, War) while RAWG is largely structural (how a
 * game *plays*: Platformer, Shooter, Strategy). Only Action, Adventure and Family
 * appear in both vocabularies, so joining on genre name finds almost nothing.
 *
 * Instead both vocabularies are projected onto a shared set of "moods", and
 * similarity is cosine distance in that mood space. It is a heuristic, not a
 * semantic model -- see the accuracy note on findMatches().
 */
export type Mood =
  | 'high-octane'
  | 'epic-quest'
  | 'mind-bender'
  | 'lighthearted'
  | 'dark-and-tense'
  | 'story-driven'
  | 'competitive';

export const MOOD_LABELS: Record<Mood, string> = {
  'high-octane': 'High-octane',
  'epic-quest': 'Epic quest',
  'mind-bender': 'Mind-bender',
  'lighthearted': 'Lighthearted',
  'dark-and-tense': 'Dark & tense',
  'story-driven': 'Story-driven',
  'competitive': 'Competitive'
};

type MoodWeights = Partial<Record<Mood, number>>;

const MOVIE_GENRE_MOODS: Record<string, MoodWeights> = {
  'Action':          { 'high-octane': 1.0, 'competitive': 0.2 },
  'Adventure':       { 'epic-quest': 1.0, 'high-octane': 0.3 },
  'Animation':       { 'lighthearted': 0.8, 'epic-quest': 0.3 },
  'Comedy':          { 'lighthearted': 1.0 },
  'Crime':           { 'dark-and-tense': 0.8, 'mind-bender': 0.6 },
  'Documentary':     { 'story-driven': 0.9, 'mind-bender': 0.3 },
  'Drama':           { 'story-driven': 1.0 },
  'Family':          { 'lighthearted': 1.0 },
  'Fantasy':         { 'epic-quest': 1.0, 'story-driven': 0.3 },
  'History':         { 'story-driven': 0.9 },
  'Horror':          { 'dark-and-tense': 1.0 },
  'Music':           { 'lighthearted': 0.7, 'story-driven': 0.4 },
  'Mystery':         { 'mind-bender': 1.0, 'dark-and-tense': 0.5 },
  'Romance':         { 'story-driven': 1.0 },
  'Science Fiction': { 'epic-quest': 0.8, 'mind-bender': 0.5 },
  'Thriller':        { 'dark-and-tense': 0.9, 'high-octane': 0.5 },
  'TV Movie':        { 'story-driven': 0.6 },
  'War':             { 'high-octane': 0.7, 'story-driven': 0.6, 'dark-and-tense': 0.4 },
  'Western':         { 'high-octane': 0.6, 'story-driven': 0.5 }
};

const GAME_GENRE_MOODS: Record<string, MoodWeights> = {
  'Action':               { 'high-octane': 1.0 },
  'Adventure':            { 'epic-quest': 1.0, 'story-driven': 0.5 },
  'Arcade':               { 'lighthearted': 0.8, 'high-octane': 0.5 },
  'Board Games':          { 'mind-bender': 0.9, 'lighthearted': 0.5, 'competitive': 0.5 },
  'Card':                 { 'mind-bender': 0.8, 'competitive': 0.5, 'lighthearted': 0.4 },
  'Casual':               { 'lighthearted': 1.0 },
  'Educational':          { 'mind-bender': 0.7, 'lighthearted': 0.4 },
  'Family':               { 'lighthearted': 1.0 },
  'Fighting':             { 'competitive': 1.0, 'high-octane': 0.8 },
  'Massively Multiplayer':{ 'competitive': 0.9, 'epic-quest': 0.6 },
  'Platformer':           { 'epic-quest': 0.7, 'lighthearted': 0.5 },
  'Puzzle':               { 'mind-bender': 1.0 },
  'Racing':               { 'competitive': 0.9, 'high-octane': 0.7 },
  'RPG':                  { 'epic-quest': 1.0, 'story-driven': 0.8 },
  'Shooter':              { 'high-octane': 1.0, 'dark-and-tense': 0.25 },
  'Simulation':           { 'mind-bender': 0.7, 'story-driven': 0.3 },
  'Sports':               { 'competitive': 1.0, 'lighthearted': 0.3 },
  'Strategy':             { 'mind-bender': 1.0, 'competitive': 0.6 }
};

const ALL_MOODS = Object.keys(MOOD_LABELS) as Mood[];

export interface CrossMediaMatch {
  media_type: MediaType;
  media_id: number;
  title: string;
  image_url: string | null;
  year: number | null;
  rating: number | null;      // 0-100, normalized across both catalogs
  similarity: number;         // 0-100, mood-space cosine
  sharedMoods: Mood[];
}

interface PoolItem {
  media_type: MediaType;
  media_id: number;
  title: string;
  image_url: string | null;
  year: number | null;
  rating: number | null;
  vector: number[];
  moods: Mood[];
  confidence: number;   // how much mood signal the genres actually carried
  reviewed: boolean;    // has a critic score, i.e. notable enough to be reviewed
}

@Injectable({ providedIn: 'root' })
export class CrossMediaService {
  private supabase = inject(SupabaseService);

  private moviePool: PoolItem[] | null = null;
  private gamePool: PoolItem[] | null = null;

  // --- Mood maths -------------------------------------------------------------

  /**
   * Genre names -> unit vector in mood space, plus a confidence score.
   *
   * Normalizing throws away magnitude, which matters: a game tagged with one
   * weak genre would otherwise point in exactly the same direction as a game
   * tagged with four strong ones, and rank identically. Confidence preserves
   * how much signal the genres actually carried.
   */
  private project(genres: string[] | null | undefined, type: MediaType): { vector: number[]; confidence: number } {
    const map = type === 'movie' ? MOVIE_GENRE_MOODS : GAME_GENRE_MOODS;
    const v = new Array(ALL_MOODS.length).fill(0);

    for (const genre of genres ?? []) {
      const weights = map[genre];
      if (!weights) continue;
      for (const [mood, w] of Object.entries(weights)) {
        v[ALL_MOODS.indexOf(mood as Mood)] += w as number;
      }
    }

    const norm = Math.hypot(...v);
    return {
      vector: norm === 0 ? v : v.map(x => x / norm),
      confidence: Math.min(1, norm / 1.2)
    };
  }

  /** Genre names -> unit vector in mood space. */
  vectorFor(genres: string[] | null | undefined, type: MediaType): number[] {
    return this.project(genres, type).vector;
  }

  /** The moods a vector actually expresses, strongest first. */
  private dominantMoods(vector: number[], threshold = 0.25): Mood[] {
    return ALL_MOODS
      .map((mood, i) => ({ mood, weight: vector[i] }))
      .filter(m => m.weight >= threshold)
      .sort((a, b) => b.weight - a.weight)
      .map(m => m.mood);
  }

  private cosine(a: number[], b: number[]): number {
    let dot = 0;
    for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
    return dot; // both inputs are unit vectors
  }

  moodsFor(genres: string[] | null | undefined, type: MediaType): Mood[] {
    return this.dominantMoods(this.vectorFor(genres, type));
  }

  // --- Pools ------------------------------------------------------------------

  /**
   * Loads and caches one catalog as mood vectors.
   *
   * Paged explicitly: PostgREST caps an unbounded select at 1000 rows, and the
   * games table is larger than that.
   */
  private async loadPool(type: MediaType): Promise<PoolItem[]> {
    const cached = type === 'movie' ? this.moviePool : this.gamePool;
    if (cached) return cached;

    const table = type === 'movie' ? 'movies' : 'games';
    const columns = type === 'movie'
      ? 'tmdb_id,title,poster_url,year,genres,vote_average'
      : 'id,name,background_image,released,genres,metacritic,rating';

    const rows: any[] = [];
    const PAGE = 1000;
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await this.supabase.client
        .from(table)
        .select(columns)
        .range(from, from + PAGE - 1);
      if (error || !data || data.length === 0) break;
      rows.push(...data);
      if (data.length < PAGE) break;
    }

    const pool: PoolItem[] = rows.map(r => {
      const genres: string[] = r.genres ?? [];
      const { vector, confidence } = this.project(genres, type);
      return type === 'movie'
        ? {
            media_type: 'movie' as MediaType,
            media_id: r.tmdb_id,
            title: r.title,
            image_url: r.poster_url ?? null,
            year: r.year ?? null,
            // TMDB vote_average is 0-10; scale to a shared 0-100.
            rating: r.vote_average != null ? Math.round(r.vote_average * 10) : null,
            vector,
            moods: this.dominantMoods(vector),
            confidence,
            reviewed: r.vote_average != null
          }
        : {
            media_type: 'game' as MediaType,
            media_id: r.id,
            title: r.name,
            image_url: r.background_image ?? null,
            year: r.released ? new Date(r.released).getFullYear() : null,
            // Prefer Metacritic (already 0-100); fall back to RAWG's 0-5 rating.
            rating: r.metacritic ?? (r.rating != null ? Math.round(r.rating * 20) : null),
            vector,
            moods: this.dominantMoods(vector),
            confidence,
            reviewed: r.metacritic != null
          };
    }).filter(p => p.media_id != null && p.title);

    if (type === 'movie') this.moviePool = pool; else this.gamePool = pool;
    return pool;
  }

  // --- Matching ---------------------------------------------------------------

  /**
   * Finds items in the *other* catalog that share a seed's mood profile.
   *
   * Ranking blends mood similarity with a quality signal, because a perfect mood
   * match nobody liked is a bad suggestion. Similarity dominates; rating breaks
   * ties among comparable matches.
   *
   * Accuracy note: this reads genres only. RAWG genres carry no horror or sci-fi
   * signal, so a horror film matches on tension rather than subject. Seeds whose
   * genres map nowhere return an empty list rather than arbitrary filler.
   */
  async findMatches(
    seed: { genres: string[] | null | undefined; type: MediaType },
    limit = 6
  ): Promise<CrossMediaMatch[]> {
    const seedVector = this.vectorFor(seed.genres, seed.type);
    if (Math.hypot(...seedVector) === 0) return [];

    const targetType: MediaType = seed.type === 'movie' ? 'game' : 'movie';
    const pool = await this.loadPool(targetType);
    const seedMoods = new Set(this.dominantMoods(seedVector));

    return pool
      .map(item => {
        const similarity = this.cosine(seedVector, item.vector) * item.confidence;
        // A critic score means the title was notable enough to review. Unreviewed
        // entries skew obscure, so discount their quality claim rather than trust it.
        const quality = ((item.rating ?? 50) / 100) * (item.reviewed ? 1 : 0.75);
        return { item, similarity, score: similarity * 0.62 + quality * 0.38 };
      })
      .filter(m => m.similarity >= 0.55)   // below this the "match" is noise
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ item, similarity }) => ({
        media_type: item.media_type,
        media_id: item.media_id,
        title: item.title,
        image_url: item.image_url,
        year: item.year,
        rating: item.rating,
        similarity: Math.round(similarity * 100),
        sharedMoods: item.moods.filter(m => seedMoods.has(m))
      }));
  }

  /**
   * Suggestions for a session: matches for what is already on the list, in the
   * opposite medium, excluding anything already there.
   */
  async suggestForSession(
    existing: { media_type: MediaType; media_id: number; genres?: string[] }[],
    seedGenres: { type: MediaType; genres: string[] }[],
    limit = 6
  ): Promise<CrossMediaMatch[]> {
    if (seedGenres.length === 0) return [];

    const taken = new Set(existing.map(e => `${e.media_type}:${e.media_id}`));
    const byKey = new Map<string, CrossMediaMatch>();

    for (const seed of seedGenres) {
      const matches = await this.findMatches(seed, limit * 2);
      for (const m of matches) {
        const key = `${m.media_type}:${m.media_id}`;
        if (taken.has(key)) continue;
        // Keep the strongest justification when several seeds point to the same item.
        const prev = byKey.get(key);
        if (!prev || m.similarity > prev.similarity) byKey.set(key, m);
      }
    }

    return Array.from(byKey.values())
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }
}
