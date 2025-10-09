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
  private apiUrl = 'http://localhost:8080/api/modelos';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ModeloBarco[]> { return this.http.get<ModeloBarco[]>(this.apiUrl); }
  getById(id: number): Observable<ModeloBarco> { return this.http.get<ModeloBarco>(`${this.apiUrl}/${id}`); }
  create(m: ModeloBarco): Observable<ModeloBarco> { return this.http.post<ModeloBarco>(this.apiUrl, m); }
  update(id: number, m: ModeloBarco): Observable<ModeloBarco> { return this.http.put<ModeloBarco>(`${this.apiUrl}/${id}`, m); }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
}
