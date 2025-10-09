import { Routes } from '@angular/router';
import { JugadoresComponent } from './components/jugadores/jugadores';
import { JugadorFormComponent } from './components/jugadores/jugador-form/jugador-form';

import { ModelosComponent } from './components/modelos/modelos';
import { ModeloFormComponent } from './components/modelos/modelo-form/modelo-form';

import { BarcosComponent } from './components/barcos/barcos';
import { BarcoFormComponent } from './components/barcos/barco-form/barco-form';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'jugadores' },

  { path: 'jugadores', component: JugadoresComponent },
  { path: 'jugadores/nuevo', component: JugadorFormComponent },
  { path: 'jugadores/:id/editar', component: JugadorFormComponent },

  { path: 'modelos', component: ModelosComponent },
  { path: 'modelos/nuevo', component: ModeloFormComponent },
  { path: 'modelos/:id/editar', component: ModeloFormComponent },

  { path: 'barcos', component: BarcosComponent },
  { path: 'barcos/nuevo', component: BarcoFormComponent },
  { path: 'barcos/:id/editar', component: BarcoFormComponent },

  { path: '**', redirectTo: 'jugadores' }
];
