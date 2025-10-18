import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ModeloBarco {
  id?: number;
  nombreModelo: string;
  color: string;
}

@Injectable({ providedIn: 'root' })
export class ModeloBarcoService {
  private base = '/api/modelos';
  constructor(private http: HttpClient) {}

  getAll(): Observable<ModeloBarco[]> { return this.http.get<ModeloBarco[]>(this.base); }
  get(id: number): Observable<ModeloBarco> { return this.http.get<ModeloBarco>(`${this.base}/${id}`); }
  create(payload: ModeloBarco): Observable<ModeloBarco> { return this.http.post<ModeloBarco>(this.base, payload); }
  update(id: number, payload: ModeloBarco): Observable<ModeloBarco> { return this.http.put<ModeloBarco>(`${this.base}/${id}`, payload); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/${id}`); }
}
