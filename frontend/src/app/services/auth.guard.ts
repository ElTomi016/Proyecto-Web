import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService, UserRole } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
  const roles = route.data?.['roles'] as UserRole[] | undefined;
  if (roles && auth.role && !roles.includes(auth.role)) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};
