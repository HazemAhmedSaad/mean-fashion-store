import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const expectedRole = route.data['role'];
  const user = auth.currentUser();

  // لو مش عامل login
  if (!user) {
    return router.createUrlTree(['/login']);
  }

  // لو الـ role صح
  if (user.role === expectedRole) {
    return true;
  }

  // لو role غلط
  return router.createUrlTree(['/']);
};