import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Jugador {
  id?: number;
  nombre: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class JugadorService {
  private apiUrl = 'http://localhost:8080/api/jugadores';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Jugador[]> { return this.http.get<Jugador[]>(this.apiUrl); }
  getById(id: number): Observable<Jugador> { return this.http.get<Jugador>(`${this.apiUrl}/${id}`); }
  create(j: Jugador): Observable<Jugador> { return this.http.post<Jugador>(this.apiUrl, j); }
  update(id: number, j: Jugador): Observable<Jugador> { return this.http.put<Jugador>(`${this.apiUrl}/${id}`, j); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
}
