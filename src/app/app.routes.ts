import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadComponent: () => import('./components/tabs.component').then(m => m.TabsComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'camera',
        loadComponent: () => import('./components/camera.component').then(m => m.CameraComponent),
      },
      {
        path: 'coach',
        loadComponent: () => import('./components/coach.component').then(m => m.CoachComponent),
      },
      {
        path: 'progress',
        loadComponent: () => import('./components/progress.component').then(m => m.ProgressComponent),
      },
      {
        path: 'profile',
        loadComponent: () => import('./components/profile.component').then(m => m.ProfileComponent),
      },
      {
        path: '',
        redirectTo: '/tabs/dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'landing',
    loadComponent: () => import('./components/landing.component').then(m => m.LandingComponent),
  },
  {
    path: '',
    redirectTo: 'landing',
    pathMatch: 'full',
  },
];
