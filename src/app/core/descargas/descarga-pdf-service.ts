import {
  HttpClient,
  HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Observable,
  tap,
} from 'rxjs';

export type TipoDocumentoPdf =
  | 'RESUMEN'
  | 'AUDITORIA';

export type AmbitoPdf =
  | 'PERSONAL'
  | 'TRABAJADOR'
  | 'EMPRESA'
  | 'GLOBAL';

export type PeriodoPdf =
  | 'DIA'
  | 'RANGO';

export interface FiltrosAuditoriaPdf {
  usuarioUuid?: string | null;
  resultado?: string | null;
  tipoEntidad?: string | null;
}

export interface DescargaPdfSolicitud {
  tipoDocumento: TipoDocumentoPdf;
  ambito: AmbitoPdf;
  periodo: PeriodoPdf;

  usuarioUuid?: string | null;
  empresaId?: number | null;

  fecha?: string | null;
  desde?: string | null;
  hasta?: string | null;

  auditoria?: FiltrosAuditoriaPdf | null;
}

@Injectable({
  providedIn: 'root',
})
export class DescargaPdfService {

  private readonly apiUrl =
    '/api/descargas/pdf';

  constructor(
    private readonly http: HttpClient
  ) {}

  descargar(
    solicitud: DescargaPdfSolicitud
  ): Observable<HttpResponse<Blob>> {

    return this.http
      .post(
        this.apiUrl,
        solicitud,
        {
          observe: 'response',
          responseType: 'blob',
        }
      )
      .pipe(
        tap((respuesta) =>
          this.guardarArchivo(
            respuesta
          )
        )
      );
  }

  private guardarArchivo(
    respuesta: HttpResponse<Blob>
  ): void {

    const contenido =
      respuesta.body;

    if (!contenido) {
      return;
    }

    const nombreArchivo =
      this.obtenerNombreArchivo(
        respuesta.headers.get(
          'Content-Disposition'
        )
      );

    const url =
      URL.createObjectURL(
        contenido
      );

    const enlace =
      document.createElement('a');

    enlace.href =
      url;

    enlace.download =
      nombreArchivo;

    document.body.appendChild(
      enlace
    );

    enlace.click();

    enlace.remove();

    URL.revokeObjectURL(
      url
    );
  }

  private obtenerNombreArchivo(
    contentDisposition: string | null
  ): string {

    if (!contentDisposition) {
      return 'barru_documento.pdf';
    }

    const utf8Pattern =
      /filename\*=UTF-8''([^;]+)/;

    const utf8 =
      utf8Pattern.exec(
        contentDisposition
      );

    if (utf8?.[1]) {

      return decodeURIComponent(
        utf8[1]
      );
    }

    const filenamePattern =
      /filename="?([^";]+)"?/;

    const normal =
      filenamePattern.exec(
        contentDisposition
      );

    return normal?.[1]
      ?? 'barru_documento.pdf';
  }
}