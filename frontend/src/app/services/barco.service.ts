import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type { Jugador } from './jugador.service';
import type { ModeloBarco } from './modelo-barco.service';

import { API_BASE_URL } from './api.config';

export interface Barco {
  id?: number;
  posX: number;
  posY: number;
  velocidadX: number;
  velocidadY: number;
  jugador?: Jugador;       // lo que viene del GET
  modelo?: ModeloBarco;    // lo que viene del GET
}

export interface BarcoPayload {
  posX: number;
  posY: number;
  velocidadX: number;
  velocidadY: number;
  jugadorId: number;
  modeloId: number;
}

@Injectable({ providedIn: 'root' })
export class BarcoService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/barcos`;

  getAll(): Observable<Barco[]> { return this.http.get<Barco[]>(this.apiUrl); }
  getById(id: number): Observable<Barco> { return this.http.get<Barco>(`${this.apiUrl}/${id}`); }
  create(payload: BarcoPayload): Observable<Barco> { return this.http.post<Barco>(this.apiUrl, payload); }
  update(id: number, payload: Partial<BarcoPayload>): Observable<Barco> {
    return this.http.put<Barco>(`${this.apiUrl}/${id}`, payload);
  }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
}
