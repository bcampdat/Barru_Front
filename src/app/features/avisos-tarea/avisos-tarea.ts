import {
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';

import {
  finalize,
  forkJoin
} from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';

import {
  AvisoTareaService
} from '../../core/proyecto/aviso-tarea/aviso-tarea-service';

import {
  AvisoTarea,
  TipoAvisoTarea
} from '../../core/proyecto/aviso-tarea/aviso-tarea-types';


interface GrupoAvisosProyecto {

  proyectoId: number;

  proyectoNombre: string;

  avisos: AvisoTarea[];
}


@Component({
  selector: 'app-avisos-tarea',
  imports: [
    ButtonModule,
    MessageModule,
    TagModule
  ],
  templateUrl: './avisos-tarea.html',
  styleUrl: './avisos-tarea.scss'
})
export class AvisosTarea implements OnInit {

  private readonly avisoTareaService =
    inject(AvisoTareaService);


  readonly avisos =
    signal<AvisoTarea[]>([]);

  readonly avisosSeleccionados =
    signal<Set<number>>(
      new Set<number>()
    );

  readonly cargando =
    signal(false);

  readonly marcandoLeidos =
    signal(false);

  readonly error =
    signal('');


  /*
   * =========================================================
   * AGRUPACIÓN POR PROYECTO
   * =========================================================
   */

  readonly gruposProyecto =
    computed<GrupoAvisosProyecto[]>(() => {

      const grupos =
        new Map<
          number,
          GrupoAvisosProyecto
        >();

      this.avisos().forEach(
        aviso => {

          let grupo =
            grupos.get(
              aviso.proyectoId
            );

          if (!grupo) {

            grupo = {
              proyectoId:
                aviso.proyectoId,

              proyectoNombre:
                aviso.proyectoNombre,

              avisos: []
            };

            grupos.set(
              aviso.proyectoId,
              grupo
            );
          }

          grupo.avisos.push(
            aviso
          );
        }
      );

      return Array.from(
        grupos.values()
      );
    });


  readonly totalNoLeidos =
    computed(() =>
      this.avisos().length
    );


  readonly totalSeleccionados =
    computed(() =>
      this.avisosSeleccionados().size
    );


  ngOnInit(): void {

    this.cargarAvisos();
  }


  /*
   * =========================================================
   * CARGA
   * =========================================================
   */

  cargarAvisos(): void {

    this.cargando.set(
      true
    );

    this.error.set(
      ''
    );

    this.avisoTareaService
      .obtenerMisAvisosNoLeidos()
      .pipe(
        finalize(() => {

          this.cargando.set(
            false
          );
        })
      )
      .subscribe({

        next: (avisos) => {

          this.avisos.set(
            avisos
          );

          this.avisosSeleccionados.set(
            new Set<number>()
          );
        },

        error: () => {

          this.error.set(
            'No se han podido cargar los avisos.'
          );
        }
      });
  }


  /*
   * =========================================================
   * SELECCIÓN
   * =========================================================
   */

  alternarSeleccion(
    avisoId: number
  ): void {

    this.avisosSeleccionados.update(
      seleccionados => {

        const nuevos =
          new Set(
            seleccionados
          );

        if (
          nuevos.has(
            avisoId
          )
        ) {

          nuevos.delete(
            avisoId
          );

        } else {

          nuevos.add(
            avisoId
          );
        }

        return nuevos;
      }
    );
  }


  estaSeleccionado(
    avisoId: number
  ): boolean {

    return this.avisosSeleccionados()
      .has(
        avisoId
      );
  }


  seleccionarProyecto(
    avisos: AvisoTarea[]
  ): void {

    this.avisosSeleccionados.update(
      seleccionados => {

        const nuevos =
          new Set(
            seleccionados
          );

        avisos.forEach(
          aviso =>
            nuevos.add(
              aviso.id
            )
        );

        return nuevos;
      }
    );
  }


  deseleccionarProyecto(
    avisos: AvisoTarea[]
  ): void {

    this.avisosSeleccionados.update(
      seleccionados => {

        const nuevos =
          new Set(
            seleccionados
          );

        avisos.forEach(
          aviso =>
            nuevos.delete(
              aviso.id
            )
        );

        return nuevos;
      }
    );
  }


  proyectoCompletoSeleccionado(
    avisos: AvisoTarea[]
  ): boolean {

    return avisos.length > 0
      &&
      avisos.every(
        aviso =>
          this.avisosSeleccionados()
            .has(
              aviso.id
            )
      );
  }


  /*
   * =========================================================
   * MARCAR COMO LEÍDOS
   * =========================================================
   */

  marcarSeleccionadosComoLeidos(): void {

    const ids =
      Array.from(
        this.avisosSeleccionados()
      );

    if (
      ids.length === 0
    ) {

      return;
    }

    this.marcandoLeidos.set(
      true
    );

    this.error.set(
      ''
    );

    const peticiones =
      ids.map(
        avisoId =>
          this.avisoTareaService
            .marcarComoLeido(
              avisoId
            )
      );

    forkJoin(
      peticiones
    )
      .pipe(
        finalize(() => {

          this.marcandoLeidos.set(
            false
          );
        })
      )
      .subscribe({

        next: () => {

          const idsLeidos =
            new Set(
              ids
            );

          this.avisos.update(
            avisos =>
              avisos.filter(
                aviso =>
                  !idsLeidos.has(
                    aviso.id
                  )
              )
          );

          this.avisosSeleccionados.set(
            new Set<number>()
          );
        },

        error: () => {

          this.error.set(
            'No se han podido marcar los avisos seleccionados como leídos.'
          );
        }
      });
  }


  /*
   * =========================================================
   * TEXTOS
   * =========================================================
   */

  obtenerTextoAviso(
    tipo: TipoAvisoTarea
  ): string {

    switch (
      tipo
    ) {

      case 'TAREA_ASIGNADA':
        return 'Nueva tarea asignada';

      case 'TAREA_FINALIZADA':
        return 'Tarea finalizada';

      case 'TAREA_RETRASADA':
        return 'Tarea retrasada';

      default:
        return 'Aviso de tarea';
    }
  }

}