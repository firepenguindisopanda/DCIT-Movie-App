import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TMDBMovieCredits {
  id: number;
  cast: TMDBCast[];
  crew: TMDBCrew[];
}

export interface TMDBCast {
  id: number;
  name: string;
  character: string;
  order: number;
  profile_path: string | null;
  known_for_department: string;
}

export interface TMDBCrew {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class TmdbService {
  private readonly baseUrl = environment.TMDB_BASE_URL;
  private readonly apiKey = environment.TMDB_API_KEY;
  private readonly imageBase = environment.TMDB_IMAGE_BASE;

  constructor(private http: HttpClient) {}

  /**
   * Get movie credits (cast & crew) from TMDB
   */
  getMovieCredits(tmdbId: number): Observable<TMDBMovieCredits> {
    const params = new HttpParams()
      .set('api_key', this.apiKey);

    return this.http.get<any>(`${this.baseUrl}/movie/${tmdbId}/credits`, { params }).pipe(
      map(response => ({
        id: response.id,
        cast: response.cast?.slice(0, 20).map((c: any) => ({
          id: c.id,
          name: c.name,
          character: c.character,
          order: c.order,
          profile_path: c.profile_path ? `${this.imageBase}/w185${c.profile_path}` : null,
          known_for_department: c.known_for_department
        })) || [],
        crew: response.crew?.map((c: any) => ({
          id: c.id,
          name: c.name,
          job: c.job,
          department: c.department,
          profile_path: c.profile_path ? `${this.imageBase}/w185${c.profile_path}` : null
        })) || []
      }))
    );
  }

  /**
   * Get specific crew members (director, writer, etc.)
   */
  getDirectors(crew: TMDBCrew[]): TMDBCrew[] {
    return crew.filter(c => c.job === 'Director');
  }

  getWriters(crew: TMDBCrew[]): TMDBCrew[] {
    return crew.filter(c => 
      c.department === 'Writing' && 
      (c.job === 'Screenplay' || c.job === 'Writer' || c.job === 'Story')
    );
  }

  getProducers(crew: TMDBCrew[]): TMDBCrew[] {
    return crew.filter(c => c.job === 'Producer');
  }
}
