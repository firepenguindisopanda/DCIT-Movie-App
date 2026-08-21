import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Both guards await the initial session check first.
 *
 * Previously they treated "still loading" as "not signed in", so a direct
 * navigation or refresh to a guarded route bounced: authGuard sent you to
 * /login, guestGuard saw the same unsettled state and sent you to /, and the
 * signed-in user landed on the home page instead of the page they asked for.
 */
export const authGuard: CanActivateFn = async (route: ActivatedRouteSnapshot): Promise<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.whenReady();

  if (authService.isAuthenticated()) {
    return true;
  }

  const returnUrl = route.url.map(s => s.path).join('/');
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: returnUrl ? `/${returnUrl}` : '/' }
  });
};

export const guestGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.whenReady();

  if (!authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/']);
};
