import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class HttpHeadersInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const url = request.url.toLowerCase();

    if (url.includes('rawg-video-games-database.p.rapidapi.com')) {
      request = request.clone({
        setHeaders: {
          'x-rapidapi-key': 'a6cb5debb5624c94b7828c86caa1c6f9',
          'x-rapidapi-host': 'rawg-video-games-database.p.rapidapi.com',
        }
      });
    }

    if (url.includes('rawg.io') && !request.params.has('key')) {
      request = request.clone({
        setParams: { key: 'a6cb5debb5624c94b7828c86caa1c6f9' }
      });
    }

    return next.handle(request);
  }
}
