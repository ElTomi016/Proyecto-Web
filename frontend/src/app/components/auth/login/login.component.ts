import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="login-card">
      <h1>Ingreso</h1>
      <p class="subtitle">Autentícate para continuar</p>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>
          Usuario
          <input type="text" formControlName="username" placeholder="usuario" />
        </label>
        <label>
          Contraseña
          <input type="password" formControlName="password" placeholder="••••••" />
        </label>
        <button type="submit" [disabled]="form.invalid || loading">
          {{ loading ? 'Validando...' : 'Ingresar' }}
        </button>
      </form>
      <p class="error" *ngIf="error">{{ error }}</p>
      <div class="helper">
        <p>Admin demo: <code>admin / admin123</code></p>
        <p>Jugador demo: <code>jugador1 / jugador1123</code></p>
      </div>
    </section>
  `,
  styles: [`
    .login-card {
      max-width: 360px;
      margin: 60px auto;
      padding: 32px;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
    }
    h1 { margin-bottom: 4px; }
    .subtitle { color: #6b7280; margin-bottom: 24px; }
    form { display: flex; flex-direction: column; gap: 16px; }
    label { display: flex; flex-direction: column; font-weight: 600; color: #374151; }
    input {
      margin-top: 6px;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid #d1d5db;
    }
    button {
      padding: 12px;
      border: none;
      border-radius: 8px;
      background: #2563eb;
      color: #fff;
      font-weight: 600;
      cursor: pointer;
    }
    button[disabled] { opacity: 0.6; cursor: not-allowed; }
    .error { color: #dc2626; margin-top: 12px; }
    .helper { margin-top: 24px; font-size: 12px; color: #6b7280; }
    code { background: #f3f4f6; padding: 2px 4px; border-radius: 4px; }
  `]
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  loading = false;
  error = '';

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid || this.loading) {
      return;
    }
    this.loading = true;
    this.error = '';
    const { username, password } = this.form.getRawValue();
    this.auth.login(username, password).subscribe({
      next: state => {
        this.loading = false;
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
          return;
        }
        this.router.navigate([state.role === 'ADMIN' ? '/admin' : '/juego']);
      },
      error: () => {
        this.loading = false;
        this.error = 'Credenciales inválidas';
      }
    });
  }
}
