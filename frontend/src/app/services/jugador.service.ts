import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Jugador {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
}

export type JugadorPayload = Omit<Jugador, 'id'>;

@Injectable({ providedIn: 'root' })
export class JugadorService {
  // Asegúrate que tu proxy.conf.json enruta /api -> http://localhost:8080
  private readonly base = '/api/jugadores';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Jugador[]> {
    return this.http.get<Jugador[]>(this.base);
  }

  getById(id: number): Observable<Jugador> {
    return this.http.get<Jugador>(`${this.base}/${id}`);
  }

  create(payload: JugadorPayload): Observable<Jugador> {
    return this.http.post<Jugador>(this.base, payload);
  }

  update(id: number, payload: JugadorPayload): Observable<Jugador> {
    return this.http.put<Jugador>(`${this.base}/${id}`, payload);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // Alias para que el componente que llama .delete(id) no falle
  delete(id: number): Observable<void> {
    return this.remove(id);
  }
}
