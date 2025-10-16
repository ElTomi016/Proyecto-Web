import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ModeloBarco {
  id: number;
  nombreModelo: string;
  color: string;
}

@Injectable({ providedIn: 'root' })
export class ModeloBarcoService {
  private BASE = '/api/modelos';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ModeloBarco[]> { return this.http.get<ModeloBarco[]>(this.BASE); }
  getById(id: number): Observable<ModeloBarco> { return this.http.get<ModeloBarco>(`${this.BASE}/${id}`); }
  create(payload: Omit<ModeloBarco, 'id'>): Observable<ModeloBarco> { return this.http.post<ModeloBarco>(this.BASE, payload); }
  update(id: number, payload: Omit<ModeloBarco, 'id'>): Observable<ModeloBarco> { return this.http.put<ModeloBarco>(`${this.BASE}/${id}`, payload); }
  remove(id: number): Observable<void> { return this.http.delete<void>(`${this.BASE}/${id}`); }
}
