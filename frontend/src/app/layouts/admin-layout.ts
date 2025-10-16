import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopbarComponent } from '../shared/topbar/topbar';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, TopbarComponent],
  template: `
    <app-topbar></app-topbar>
    <main class="container">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .container { max-width: 1200px; margin: 24px auto; padding: 0 16px; }
  `],
})
export class AdminLayoutComponent {}
