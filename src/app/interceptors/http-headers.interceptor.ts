import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable()
export class HttpHeadersInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const url = request.url.toLowerCase();

    if (url.includes('rawg-video-games-database.p.rapidapi.com')) {
      request = request.clone({
        setHeaders: {
          'x-rapidapi-key': environment.RAWG_API_KEY,
          'x-rapidapi-host': 'rawg-video-games-database.p.rapidapi.com',
        }
      });
    }

    if (url.includes('rawg.io') && !request.params.has('key')) {
      request = request.clone({
        setParams: { key: environment.RAWG_API_KEY }
      });
    }

    return next.handle(request);
  }
}
