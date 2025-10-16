import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Barco {
  id: number;
  jugadorId: number;
  modeloId: number;
  posX: number;
  posY: number;
  velocidadX: number;
  velocidadY: number;
}

@Injectable({ providedIn: 'root' })
export class BarcoService {
  private BASE = '/api/barcos';
  constructor(private http: HttpClient) {}

  getAll(): Observable<Barco[]> { return this.http.get<Barco[]>(this.BASE); }
  getById(id: number): Observable<Barco> { return this.http.get<Barco>(`${this.BASE}/${id}`); }
  create(payload: Omit<Barco, 'id'>): Observable<Barco> { return this.http.post<Barco>(this.BASE, payload); }
  update(id: number, payload: Omit<Barco, 'id'>): Observable<Barco> { return this.http.put<Barco>(`${this.BASE}/${id}`, payload); }
  remove(id: number): Observable<void> { return this.http.delete<void>(`${this.BASE}/${id}`); }
}
