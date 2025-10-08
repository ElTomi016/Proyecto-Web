import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { JugadoresComponent } from './components/jugadores/jugadores';  // importa tu componente

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [JugadoresComponent],  // <-- agregalo acá
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  title = 'frontend';
}
