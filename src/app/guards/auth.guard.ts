import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Auth is initialized and user is logged in
  if (!authService.loading() && authService.isAuthenticated()) {
    return true;
  }

  // Not authenticated - redirect to login
  const returnUrl = route.url.map(s => s.path).join('/');
  return router.createUrlTree(['/login'], { 
    queryParams: { returnUrl: returnUrl || '/' } 
  });
};

export const guestGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Auth is initialized and user is NOT logged in
  if (!authService.loading() && !authService.isAuthenticated()) {
    return true;
  }

  // Already logged in - redirect to home
  return router.createUrlTree(['/']);
};
