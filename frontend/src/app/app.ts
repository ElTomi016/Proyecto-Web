import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TopbarComponent } from './shared/topbar/topbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TopbarComponent],
  template: `
    <app-topbar></app-topbar>
    <main class="container">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .container { max-width: 1200px; margin: 0 auto; padding: 16px; }
  `]
})
export class AppComponent {}
