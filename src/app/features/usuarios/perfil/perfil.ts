import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';

import { UsuarioService } from '../../../core/usuarios/usuario-service';
import { PerfilDTO } from '../../../core/usuarios/usuario.types';

@Component({
  selector: 'app-perfil',
  imports: [
    FormsModule,
    InputTextModule,
    MessageModule,
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil implements OnInit {

  readonly cargando = signal(false);
  readonly guardando = signal(false);

  readonly error = signal<string | null>(null);
  readonly exito = signal<string | null>(null);

  nombre = '';
  apellidos = '';
  email = '';
  fotoPerfil: string | null = null;

  fotoNueva: File | null = null;

  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPerfil();
  }

  seleccionarFoto(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    const archivo =
      input.files?.[0] ?? null;

    this.error.set(null);

    if (archivo === null) {
      this.fotoNueva = null;
      return;
    }

    const tiposPermitidos = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!tiposPermitidos.includes(archivo.type)) {
      input.value = '';
      this.fotoNueva = null;

      this.error.set(
        'La foto debe ser JPG, PNG o WEBP.'
      );

      return;
    }

    const maximoBytes =
      5 * 1024 * 1024;

    if (archivo.size > maximoBytes) {
      input.value = '';
      this.fotoNueva = null;

      this.error.set(
        'La foto no puede superar los 5 MB.'
      );

      return;
    }

    this.fotoNueva = archivo;
  }

  guardar(): void {
    this.limpiarMensajes();

    const perfil: PerfilDTO = {
      nombre: this.nombre.trim(),
      apellidos: this.apellidos.trim(),
      email: this.email.trim(),
      fotoPerfil: this.fotoPerfil,
    };

    this.guardando.set(true);

    this.usuarioService
      .modificarPerfil(
        perfil,
        this.fotoNueva ?? undefined
      )
      .pipe(
        finalize(() =>
          this.guardando.set(false)
        )
      )
      .subscribe({
        next: respuesta => {
          this.aplicarPerfil(respuesta);
          this.fotoNueva = null;

          this.exito.set(
            'Perfil actualizado correctamente.'
          );
        },

        error: error =>
          this.mostrarError(error),
      });
  }

  volver(): void {
    void this.router.navigateByUrl('/inicio');
  }

  private cargarPerfil(): void {
    this.cargando.set(true);

    this.usuarioService
      .obtenerPerfil()
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({
        next: perfil =>
          this.aplicarPerfil(perfil),

        error: error =>
          this.mostrarError(error),
      });
  }

  private aplicarPerfil(
    perfil: PerfilDTO
  ): void {
    this.nombre = perfil.nombre;
    this.apellidos = perfil.apellidos;
    this.email = perfil.email;
    this.fotoPerfil =
      perfil.fotoPerfil ?? null;
  }

  private limpiarMensajes(): void {
    this.error.set(null);
    this.exito.set(null);
  }

  private mostrarError(
    error: unknown
  ): void {
    if (error instanceof HttpErrorResponse) {
      this.error.set(
        error.error?.message ??
        'No se ha podido completar la operación.'
      );

      return;
    }

    this.error.set(
      'No se ha podido completar la operación.'
    );
  }
}
