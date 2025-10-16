import { Routes } from '@angular/router';

// Panel de administración
import { AdminComponent } from './components/admin/admin';

// CRUD Jugadores
import { JugadoresComponent } from './components/jugadores/jugadores';
import { JugadorFormComponent } from './components/jugadores/jugador-form/jugador-form';

// CRUD Modelos
import { ModelosComponent } from './components/modelos/modelos';
import { ModelosFormComponent } from './components/modelos/modelo-form/modelo-form';

// CRUD Barcos
import { BarcosComponent } from './components/barcos/barcos';
import { BarcoFormComponent } from './components/barcos/barco-form/barco-form';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'admin' },

  { path: 'admin', component: AdminComponent },

  // Jugadores
  { path: 'admin/jugadores', component: JugadoresComponent },
  { path: 'admin/jugadores/nuevo', component: JugadorFormComponent },
  { path: 'admin/jugadores/:id/editar', component: JugadorFormComponent },

  // Modelos de Barco
  { path: 'admin/modelos', component: ModelosComponent },
  { path: 'admin/modelos/nuevo', component: ModelosFormComponent },
  { path: 'admin/modelos/:id/editar', component: ModelosFormComponent },

  // Barcos
  { path: 'admin/barcos', component: BarcosComponent },
  { path: 'admin/barcos/nuevo', component: BarcoFormComponent },
  { path: 'admin/barcos/:id/editar', component: BarcoFormComponent },

  { path: '**', redirectTo: 'admin' }
];
