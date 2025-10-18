import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Jugador {
  id?: number;
  nombre: string;
  email: string;
  telefono?: string;
}

@Injectable({ providedIn: 'root' })
export class JugadorService {
  private base = '/api/jugadores';
  constructor(private http: HttpClient) {}

  getAll(): Observable<Jugador[]> { return this.http.get<Jugador[]>(this.base); }
  get(id: number): Observable<Jugador> { return this.http.get<Jugador>(`${this.base}/${id}`); }
  create(payload: Jugador): Observable<Jugador> { return this.http.post<Jugador>(this.base, payload); }
  update(id: number, payload: Jugador): Observable<Jugador> { return this.http.put<Jugador>(`${this.base}/${id}`, payload); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/${id}`); }
}
