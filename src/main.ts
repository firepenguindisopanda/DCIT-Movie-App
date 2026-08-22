import {
  enableProdMode,
  importProvidersFrom,
  provideZoneChangeDetection,
  provideBrowserGlobalErrorListeners
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import { GaugeModule } from 'angular-gauge';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { HttpHeadersInterceptor } from './app/interceptors/http-headers.interceptor';
import { HttpErrorsInterceptor } from './app/interceptors/http-errors-interceptor';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    // Routes uncaught errors and unhandled rejections through Angular's
    // ErrorHandler rather than letting them vanish on window.
    provideBrowserGlobalErrorListeners(),
    // v21 no longer assumes zone.js; zone-based change detection is now opt-in.
    provideZoneChangeDetection(),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    // withInterceptorsFromDi keeps the two existing class-based interceptors
    // working without rewriting them as functional interceptors.
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    // angular-gauge still ships as an NgModule with a forRoot().
    importProvidersFrom(GaugeModule.forRoot()),
    { provide: HTTP_INTERCEPTORS, useClass: HttpHeadersInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorsInterceptor, multi: true }
  ]
}).catch(err => console.error(err));
