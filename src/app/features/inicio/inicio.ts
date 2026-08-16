import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-inicio',
  imports: [
    ButtonModule,
  ],
  templateUrl: './inicio.html',
  styleUrl: './inicio.scss',
})
export class Inicio {

  readonly error = signal<string | null>(null);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  cerrarSesion(): void {

    this.error.set(null);

    this.authService
      .logout()
      .subscribe({
        next: () => {
          this.router.navigateByUrl('/login');
        },

        error: () => {
          this.error.set(
            'No se ha podido cerrar la sesión.'
          );
        },
      });
  }
}