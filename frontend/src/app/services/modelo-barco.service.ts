import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ModeloBarco {
  id: number;              // <-- obligatorio (lo devuelve el backend)
  nombreModelo: string;
  color: string;
}

export type ModeloBarcoPayload = Omit<ModeloBarco, 'id'>;

@Injectable({ providedIn: 'root' })
export class ModeloBarcoService {
  private http = inject(HttpClient);
  private base = '/api/modelos';

  getAll(): Observable<ModeloBarco[]> {
    return this.http.get<ModeloBarco[]>(this.base);
  }

  getById(id: number): Observable<ModeloBarco> {
    return this.http.get<ModeloBarco>(`${this.base}/${id}`);
  }

  create(body: ModeloBarcoPayload): Observable<ModeloBarco> {
    return this.http.post<ModeloBarco>(this.base, body);
  }

  update(id: number, body: ModeloBarcoPayload): Observable<ModeloBarco> {
    return this.http.put<ModeloBarco>(`${this.base}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
