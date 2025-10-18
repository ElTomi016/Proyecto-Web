import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/admin', pathMatch: 'full' },

  // Dashboard simple (panel)
  { path: 'admin', loadComponent: () => import('./components/admin/admin').then(m => m.AdminComponent) },

  // Barcos
  { path: 'admin/barcos', loadComponent: () => import('./components/barcos/barcos').then(m => m.BarcosComponent) },
  { path: 'admin/barcos/nuevo', loadComponent: () => import('./components/barcos/barco-form/barco-form').then(m => m.BarcoFormComponent) },
  { path: 'admin/barcos/:id/editar', loadComponent: () => import('./components/barcos/barco-form/barco-form').then(m => m.BarcoFormComponent) },

  // Jugadores
  { path: 'admin/jugadores', loadComponent: () => import('./components/jugadores/jugadores').then(m => m.JugadoresComponent) },
  { path: 'admin/jugadores/nuevo', loadComponent: () => import('./components/jugadores/jugador-form/jugador-form').then(m => m.JugadorFormComponent) },
  { path: 'admin/jugadores/:id/editar', loadComponent: () => import('./components/jugadores/jugador-form/jugador-form').then(m => m.JugadorFormComponent) },

  // Modelos
  { path: 'admin/modelos', loadComponent: () => import('./components/modelos/modelos').then(m => m.ModelosComponent) },
  { path: 'admin/modelos/nuevo', loadComponent: () => import('./components/modelos/modelo-form/modelo-form').then(m => m.ModelosFormComponent) },
  { path: 'admin/modelos/:id/editar', loadComponent: () => import('./components/modelos/modelo-form/modelo-form').then(m => m.ModelosFormComponent) },

  { path: '**', redirectTo: '/admin' }
];
