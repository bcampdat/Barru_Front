import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Observable } from 'rxjs';

import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';

import { AuditoriaService } from '../../core/auditoria/auditoria-service';
import {
  AuditoriaDTO,
  AuditoriaFiltros,
  PaginaAuditoriaDTO,
} from '../../core/auditoria/auditoria-types';

import { AuthService } from '../../core/auth/auth.service';

import {
  DescargaPdfService,
  DescargaPdfSolicitud,
} from '../../core/descargas/descarga-pdf-service';

import { EmpresaService } from '../../core/empresa/empresa-service';
import { EmpresaDTO } from '../../core/empresa/empresa.types';

import { UsuarioService } from '../../core/usuarios/usuario-service';
import { UserDTO } from '../../core/usuarios/usuario.types';


type AmbitoAuditoriaAdmin =
  | 'GLOBAL'
  | 'EMPRESA';


@Component({
  selector: 'app-auditoria',
  imports: [
    DatePipe,
    FormsModule,
    MessageModule,
    TableModule,
  ],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.scss',
})
export class Auditoria implements OnInit {

  readonly auditorias =
    signal<AuditoriaDTO[]>([]);

  readonly empresas =
    signal<EmpresaDTO[]>([]);

  readonly usuarios =
    signal<UserDTO[]>([]);

  readonly cargando =
    signal(false);

  readonly descargando =
    signal(false);

  readonly error =
    signal<string | null>(null);

  readonly esAdmin =
    signal(false);

  readonly ambitoAdmin =
    signal<AmbitoAuditoriaAdmin>(
      'GLOBAL'
    );

  readonly empresaId =
    signal<number | null>(
      null
    );

  readonly pagina =
    signal(0);

  readonly tamanoPagina =
    signal(20);

  readonly totalElementos =
    signal(0);

  readonly totalPaginas =
    signal(0);


  desde = '';

  hasta = '';

  usuarioUuid = '';

  tipoEntidad = '';

  resultado = '';


  constructor(
    private readonly authService:
      AuthService,

    private readonly auditoriaService:
      AuditoriaService,

    private readonly empresaService:
      EmpresaService,

    private readonly usuarioService:
      UsuarioService,

    private readonly descargaPdfService:
      DescargaPdfService
  ) {}


  ngOnInit(): void {

    const sesion =
      this.authService.getSesion();

    if (!sesion) {
      return;
    }

    const hoy =
      this.fechaHoyIso();

    this.desde = hoy;
    this.hasta = hoy;

    this.esAdmin.set(
      sesion.rol === 'ADMIN_SISTEMA'
    );

    if (this.esAdmin()) {

      this.inicializarAdmin();

      return;
    }

    if (sesion.rol === 'ENCARGADO') {

      this.inicializarEncargado(
        sesion.usuarioUuid
      );

      return;
    }

    this.error.set(
      'No tienes permisos para consultar la auditoría.'
    );
  }


  seleccionarAmbitoAdmin(
    ambito: AmbitoAuditoriaAdmin
  ): void {

    this.ambitoAdmin.set(
      ambito
    );

    this.empresaId.set(
      null
    );

    this.usuarios.set(
      []
    );

    this.usuarioUuid = '';

    this.pagina.set(
      0
    );

    this.auditorias.set(
      []
    );

    this.totalElementos.set(
      0
    );

    this.totalPaginas.set(
      0
    );

    if (ambito === 'GLOBAL') {

      this.consultar();
    }
  }


  seleccionarEmpresa(
    empresaId: number | null
  ): void {

    this.empresaId.set(
      empresaId
    );

    this.usuarios.set(
      []
    );

    this.usuarioUuid = '';

    this.pagina.set(
      0
    );

    if (empresaId === null) {

      this.auditorias.set(
        []
      );

      this.totalElementos.set(
        0
      );

      this.totalPaginas.set(
        0
      );

      return;
    }

    this.cargarUsuariosEmpresa(
      empresaId
    );

    this.consultar();
  }


  consultarDesdeInicio(): void {

    this.pagina.set(
      0
    );

    this.consultar();
  }


  consultar(): void {

    if (!this.validarRango()) {
      return;
    }

    if (
      this.esAdmin()
      && this.ambitoAdmin() === 'EMPRESA'
      && this.empresaId() === null
    ) {

      this.error.set(
        'Selecciona una empresa.'
      );

      return;
    }

    this.error.set(
      null
    );

    this.cargando.set(
      true
    );

    const filtros =
      this.crearFiltros();

    this.obtenerPeticion(
      filtros
    )
      .pipe(
        finalize(() =>
          this.cargando.set(false)
        )
      )
      .subscribe({
        next: pagina =>
          this.aplicarPagina(
            pagina
          ),

        error: error =>
          this.mostrarError(
            error
          ),
      });
  }


  paginaAnterior(): void {

    if (
      this.cargando()
      || this.pagina() <= 0
    ) {

      return;
    }

    this.pagina.update(
      pagina => pagina - 1
    );

    this.consultar();
  }


  paginaSiguiente(): void {

    if (
      this.cargando()
      || this.pagina() + 1
        >= this.totalPaginas()
    ) {

      return;
    }

    this.pagina.update(
      pagina => pagina + 1
    );

    this.consultar();
  }


  cambiarTamanoPagina(
    tamano: number
  ): void {

    if (
      !Number.isInteger(tamano)
      || tamano <= 0
    ) {

      return;
    }

    this.tamanoPagina.set(
      tamano
    );

    this.pagina.set(
      0
    );

    this.consultar();
  }


  numeroPaginaVisible(): number {

    if (this.totalPaginas() === 0) {
      return 0;
    }

    return this.pagina() + 1;
  }


  limpiarFiltros(): void {

    const hoy =
      this.fechaHoyIso();

    this.desde = hoy;
    this.hasta = hoy;

    this.usuarioUuid = '';

    this.tipoEntidad = '';

    this.resultado = '';

    this.pagina.set(
      0
    );

    this.consultar();
  }


  descargarPdf(): void {

    this.error.set(
      null
    );

    const solicitud =
      this.crearSolicitudDescarga();

    if (!solicitud) {
      return;
    }

    this.descargando.set(
      true
    );

    this.descargaPdfService
      .descargar(
        solicitud
      )
      .pipe(
        finalize(() =>
          this.descargando.set(false)
        )
      )
      .subscribe({
        error: error =>
          this.mostrarErrorDescarga(
            error
          ),
      });
  }


  puedeDescargar(): boolean {

    if (
      this.cargando()
      || this.descargando()
      || this.totalElementos() === 0
    ) {

      return false;
    }

    if (
      !this.desde
      || !this.hasta
      || this.desde > this.hasta
    ) {

      return false;
    }

    if (
      this.esAdmin()
      && this.ambitoAdmin() === 'EMPRESA'
    ) {

      return this.empresaId() !== null;
    }

    return true;
  }


  private crearFiltros():
    AuditoriaFiltros {

    return {
      usuarioUuid:
        this.usuarioUuid || null,

      desde:
        this.desde || null,

      hasta:
        this.hasta || null,

      resultado:
        this.resultado || null,

      tipoEntidad:
        this.tipoEntidad || null,

      page:
        this.pagina(),

      size:
        this.tamanoPagina(),

      sort:
        'fechaHora,desc',
    };
  }


  private crearSolicitudDescarga():
    DescargaPdfSolicitud | null {

    if (
      !this.desde
      || !this.hasta
    ) {

      this.error.set(
        'Selecciona el periodo que quieres descargar.'
      );

      return null;
    }

    if (!this.validarRango()) {
      return null;
    }

    const auditoria = {
      usuarioUuid:
        this.usuarioUuid || null,

      resultado:
        this.resultado || null,

      tipoEntidad:
        this.tipoEntidad || null,
    };

    const periodo =
      this.desde === this.hasta
        ? {
            periodo: 'DIA' as const,
            fecha: this.desde,
          }
        : {
            periodo: 'RANGO' as const,
            desde: this.desde,
            hasta: this.hasta,
          };

    if (
      this.esAdmin()
      && this.ambitoAdmin() === 'GLOBAL'
    ) {

      return {
        tipoDocumento: 'AUDITORIA',
        ambito: 'GLOBAL',
        ...periodo,
        auditoria,
      };
    }

    if (this.esAdmin()) {

      const empresaId =
        this.empresaId();

      if (empresaId === null) {

        this.error.set(
          'Selecciona una empresa.'
        );

        return null;
      }

      return {
        tipoDocumento: 'AUDITORIA',
        ambito: 'EMPRESA',
        empresaId,
        ...periodo,
        auditoria,
      };
    }

    return {
      tipoDocumento: 'AUDITORIA',
      ambito: 'EMPRESA',
      ...periodo,
      auditoria,
    };
  }


  private validarRango(): boolean {

    if (
      this.desde
      && this.hasta
      && this.desde > this.hasta
    ) {

      this.error.set(
        'La fecha inicial no puede ser posterior a la fecha final.'
      );

      return false;
    }

    return true;
  }


  textoAccion(
    accion: string
  ): string {

    if (!accion.trim()) {
      return 'Sin acción';
    }

    const texto =
      accion
        .trim()
        .toLowerCase()
        .replaceAll(
          '_',
          ' '
        );

    return texto.charAt(0)
      .toUpperCase()
      + texto.slice(1);
  }


  textoResultado(
    resultado: string
  ): string {

    switch (
      resultado
        .trim()
        .toUpperCase()
    ) {

      case 'OK':
        return 'Correcto';

      case 'ERROR':
        return 'Error';

      case 'DENEGADO':
        return 'Denegado';

      default:
        return resultado || '—';
    }
  }


  textoRol(
    rol: string | null
  ): string {

    switch (rol) {

      case 'ADMIN_SISTEMA':
        return 'Administrador del sistema';

      case 'ENCARGADO':
        return 'Encargado';

      case 'EMPLEADO':
        return 'Empleado';

      default:
        return rol || '—';
    }
  }


  private inicializarAdmin(): void {

    this.cargando.set(
      true
    );

    this.empresaService
      .obtenerTodasLasEmpresas()
      .subscribe({
        next: empresas => {

          this.empresas.set(
            empresas
          );

          this.cargando.set(
            false
          );

          this.consultar();
        },

        error: error => {

          this.cargando.set(
            false
          );

          this.mostrarError(
            error
          );
        },
      });
  }


  private inicializarEncargado(
    usuarioUuid: string
  ): void {

    this.cargando.set(
      true
    );

    this.usuarioService
      .buscarPorUuid(
        usuarioUuid
      )
      .subscribe({
        next: usuario => {

          const empresaId =
            usuario.empresaId;

          if (empresaId == null) {

            this.cargando.set(
              false
            );

            this.error.set(
              'El encargado no tiene una empresa asociada.'
            );

            return;
          }

          this.empresaId.set(
            empresaId
          );

          this.cargarUsuariosEmpresa(
            empresaId
          );

          this.cargando.set(
            false
          );

          this.consultar();
        },

        error: error => {

          this.cargando.set(
            false
          );

          this.mostrarError(
            error
          );
        },
      });
  }


  private cargarUsuariosEmpresa(
    empresaId: number
  ): void {

    this.usuarioService
      .listarPorEmpresa(
        empresaId
      )
      .subscribe({
        next: usuarios =>
          this.usuarios.set(
            usuarios
          ),

        error: error =>
          this.mostrarError(
            error
          ),
      });
  }


  private obtenerPeticion(
    filtros: AuditoriaFiltros
  ): Observable<PaginaAuditoriaDTO> {

    if (!this.esAdmin()) {

      return this.auditoriaService
        .consultarMiEmpresa(
          filtros
        );
    }

    if (
      this.ambitoAdmin()
        === 'GLOBAL'
    ) {

      return this.auditoriaService
        .consultarGlobal(
          filtros
        );
    }

    const empresaId =
      this.empresaId();

    if (empresaId === null) {

      throw new Error(
        'La empresa es obligatoria'
      );
    }

    return this.auditoriaService
      .consultarPorEmpresa(
        empresaId,
        filtros
      );
  }


  private aplicarPagina(
    respuesta: PaginaAuditoriaDTO
  ): void {

    this.auditorias.set(
      respuesta.content
    );

    this.pagina.set(
      respuesta.page.number
    );

    this.tamanoPagina.set(
      respuesta.page.size
    );

    this.totalElementos.set(
      respuesta.page.totalElements
    );

    this.totalPaginas.set(
      respuesta.page.totalPages
    );
  }


  private fechaHoyIso(): string {

    return new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone: 'Europe/Madrid',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }
    ).format(
      new Date()
    );
  }


  private mostrarError(
    error: unknown
  ): void {

    if (
      error
      instanceof HttpErrorResponse
    ) {

      this.error.set(
        error.error?.message
        ?? 'No se ha podido consultar la auditoría.'
      );

      return;
    }

    this.error.set(
      'No se ha podido consultar la auditoría.'
    );
  }


  private mostrarErrorDescarga(
    error: unknown
  ): void {

    if (
      !(
        error
        instanceof HttpErrorResponse
      )
    ) {

      this.error.set(
        'No se ha podido descargar el PDF.'
      );

      return;
    }

    if (
      error.error
      instanceof Blob
    ) {

      void this.leerErrorBlob(
        error.error
      );

      return;
    }

    this.error.set(
      error.error?.message
      ?? 'No se ha podido descargar el PDF.'
    );
  }


  private async leerErrorBlob(
    blob: Blob
  ): Promise<void> {

    try {

      const respuesta =
        JSON.parse(
          await blob.text()
        ) as {
          message?: string;
        };

      this.error.set(
        respuesta.message
        ?? 'No se ha podido descargar el PDF.'
      );

    } catch {

      this.error.set(
        'No se ha podido descargar el PDF.'
      );
    }
  }

}