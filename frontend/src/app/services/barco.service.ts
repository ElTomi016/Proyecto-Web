import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface JugadorRef {
  id: number;
  nombre: string;
  email: string;
}
export interface ModeloRef {
  id: number;
  nombreModelo: string;
  color: string;
}

/** Lo que devuelve el backend al listar/consultar */
export interface Barco {
  id: number;
  posX: number;
  posY: number;
  velocidadX: number;
  velocidadY: number;
  jugador: JugadorRef | null;
  modelo: ModeloRef  | null;
}

/** Lo que ENVIAMOS para crear/actualizar (IDs, no objetos) */
export interface BarcoRaw {
  posX: number;
  posY: number;
  velocidadX: number;
  velocidadY: number;
  jugadorId: number;
  modeloId: number;
}

@Injectable({ providedIn: 'root' })
export class BarcoService {
  private BASE = '/api/barcos';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Barco[]> {
    return this.http.get<Barco[]>(this.BASE);
  }

  getById(id: number): Observable<Barco> {
    return this.http.get<Barco>(`${this.BASE}/${id}`);
  }

  /** Crear con IDs */
  createRaw(payload: BarcoRaw): Observable<Barco> {
    return this.http.post<Barco>(this.BASE, payload);
  }

  /** Actualizar con IDs */
  updateRaw(id: number, payload: BarcoRaw): Observable<Barco> {
    return this.http.put<Barco>(`${this.BASE}/${id}`, payload);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }
}
