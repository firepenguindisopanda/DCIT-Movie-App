import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment as env } from '../../environments/environment';
import { forkJoin, map, Observable } from 'rxjs';
import { APIResponse, Game } from '../model';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(private readonly http: HttpClient) { }

  getGameList(
    ordering: string,
    search?: string
  ): Observable<APIResponse<Game>> {
    let params = new HttpParams().set('ordering', ordering).set('key', env.RAWG_API_KEY);
    if (search) {
      params = new HttpParams().set('ordering', ordering).set('search', search).set('key', env.RAWG_API_KEY);
    }

    return this.http.get<APIResponse<Game>>(`${env.BASE_URL}/games`, {
      params: params,
    });
  }

  getGameDetails(id: string): Observable<Game> {
    const gameInfoRequest = this.http.get(`${env.BASE_URL}/games/${id}`, { params: new HttpParams().set('key', env.RAWG_API_KEY) });
    const gameTrailersRequest = this.http.get(`${env.BASE_URL}/games/${id}/movies`, { params: new HttpParams().set('key', env.RAWG_API_KEY) });

    const gameScreenshotsRequest = this.http.get(
      `${env.BASE_URL}/games/${id}/screenshots`, { params: new HttpParams().set('key', env.RAWG_API_KEY) }
    );
    return forkJoin({
      gameInfoRequest,
      gameScreenshotsRequest,
      gameTrailersRequest,

    }).pipe(
      map((resp: any) => {
        return {
          ...resp['gameInfoRequest'],
          screenshots: resp['gameScreenshotsRequest']?.results,
          trailers: resp['gameTrailersRequest']?.results,
        };
      })
    );
  }
}
