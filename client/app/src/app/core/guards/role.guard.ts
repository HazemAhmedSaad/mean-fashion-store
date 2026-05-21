import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const expectedRole = route.data['expectedRole'] as string | undefined;

  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  if (expectedRole && auth.getRole() !== expectedRole) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
