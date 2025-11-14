import { Routes } from '@angular/router';
import { provideRouter } from '@angular/router';
import { authGuard } from './services/auth.guard';

// importar componentes standalone
import { MapaComponent } from './components/mapa/mapa.component';
import { JuegoSetupComponent } from './components/juego-setup/setup.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent) },

  // Dashboard simple (panel)
  { path: 'admin', canActivate: [authGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./components/admin/admin').then(m => (m as any).default || (m as any).AdminComponent) },

  // Barcos
  { path: 'admin/barcos', canActivate: [authGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./components/barcos/barcos').then(m => m.BarcosComponent) },
  { path: 'admin/barcos/nuevo', canActivate: [authGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./components/barcos/barco-form/barco-form').then(m => m.BarcoFormComponent) },
  { path: 'admin/barcos/:id/editar', canActivate: [authGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./components/barcos/barco-form/barco-form').then(m => m.BarcoFormComponent) },

  // Jugadores
  { path: 'admin/jugadores', canActivate: [authGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./components/jugadores/jugadores').then(m => m.JugadoresComponent) },
  { path: 'admin/jugadores/nuevo', canActivate: [authGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./components/jugadores/jugador-form/jugador-form').then(m => m.JugadorFormComponent) },
  { path: 'admin/jugadores/:id/editar', canActivate: [authGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./components/jugadores/jugador-form/jugador-form').then(m => m.JugadorFormComponent) },

  // Modelos
  { path: 'admin/modelos', canActivate: [authGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./components/modelos/modelos').then(m => m.ModelosComponent) },
  { path: 'admin/modelos/nuevo', canActivate: [authGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./components/modelos/modelo-form/modelo-form').then(m => m.ModelosFormComponent) },
  { path: 'admin/modelos/:id/editar', canActivate: [authGuard], data: { roles: ['ADMIN'] }, loadComponent: () => import('./components/modelos/modelo-form/modelo-form').then(m => m.ModelosFormComponent) },

  { path: 'juego', canActivate: [authGuard], data: { roles: ['ADMIN', 'JUGADOR'] }, component: MapaComponent },
  { path: 'juego/setup', canActivate: [authGuard], data: { roles: ['ADMIN', 'JUGADOR'] }, component: JuegoSetupComponent },
  { path: '**', redirectTo: '/login' }
];

// si usas provideRouter en bootstrap, deja intacto; si tu archivo registra rutas de otra forma,
// el route arriba debe agregarse al array de rutas exportado.
export const appRouterProviders = [
  provideRouter(routes)
];
