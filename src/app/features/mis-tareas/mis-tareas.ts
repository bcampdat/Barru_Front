import {
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

import {
  finalize,
  Observable
} from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import {
  AvisoTareaService
} from '../../core/proyecto/aviso-tarea/aviso-tarea-service';

import {
  TareaService
} from '../../core/proyecto/tarea/tarea-service';

import {
  Tarea
} from '../../core/proyecto/tarea/tarea-types';


type VistaTareas =
  | 'RESUMEN'
  | 'HOY'
  | 'EN_CURSO'
  | 'EN_PAUSA'
  | 'PENDIENTES'
  | 'RETRASADAS'
  | 'PRIORIDAD_ALTA'
  | 'PRIORIDAD_MEDIA'
  | 'PRIORIDAD_BAJA'
  | 'PROYECTOS'
  | 'PROYECTO'
  | 'HISTORICO';


interface ProyectoTrabajo {

  id: number;

  nombre: string;

  tareasActivas: number;

  tareasFinalizadas: number;
}


@Component({
  selector: 'app-mis-tareas',
  imports: [
    RouterLink,
    ButtonModule,
    MessageModule,
    TableModule,
    TagModule
  ],
  templateUrl: './mis-tareas.html',
  styleUrl: './mis-tareas.scss'
})
export class MisTareas implements OnInit {

  private readonly tareaService =
    inject(TareaService);

  private readonly avisoTareaService =
    inject(AvisoTareaService);


  /*
   * =========================================================
   * DATOS
   * =========================================================
   */

  readonly tareas =
    signal<Tarea[]>([]);

  readonly avisosNoLeidos =
    signal(0);


  /*
   * =========================================================
   * NAVEGACIÓN
   * =========================================================
   */

  readonly vistaActiva =
    signal<VistaTareas>('RESUMEN');

  readonly proyectoSeleccionadoId =
    signal<number | null>(null);


  /*
   * =========================================================
   * ESTADOS DE INTERFAZ
   * =========================================================
   */

  readonly cargando =
    signal(false);

  readonly tareaProcesandoId =
    signal<number | null>(null);

  readonly error =
    signal('');


  /*
   * =========================================================
   * ESTADO DE LAS TAREAS
   * =========================================================
   */

  readonly tareasHoy =
    computed(() => {

      const hoy =
        this.obtenerInicioHoy();

      return this.tareas().filter(
        tarea => {

          if (
            tarea.estado === 'FINALIZADA'
          ) {

            return false;
          }

          const fechaLimite =
            this.convertirFecha(
              tarea.fechaLimite
            );

          return fechaLimite <= hoy
            || tarea.estado === 'INICIADA'
            || tarea.estado === 'PAUSA';
        }
      );
    });


  readonly tareasEnCurso =
    computed(() =>
      this.tareas().filter(
        tarea =>
          tarea.estado === 'INICIADA'
      )
    );


  readonly tareasEnPausa =
    computed(() =>
      this.tareas().filter(
        tarea =>
          tarea.estado === 'PAUSA'
      )
    );


  readonly tareasPendientes =
    computed(() =>
      this.tareas().filter(
        tarea =>
          tarea.estado === 'SIN_INICIAR'
      )
    );


  readonly tareasRetrasadas =
    computed(() =>
      this.tareas().filter(
        tarea =>
          this.esTareaRetrasada(
            tarea
          )
      )
    );


  readonly tareasHistorico =
    computed(() =>
      this.tareas().filter(
        tarea =>
          tarea.estado === 'FINALIZADA'
      )
    );


  /*
   * =========================================================
   * PRIORIDADES
   * =========================================================
   */

  readonly tareasPrioridadAlta =
    computed(() =>
      this.tareas().filter(
        tarea =>
          tarea.estado !== 'FINALIZADA'
          &&
          tarea.prioridad === 'ALTA'
      )
    );


  readonly tareasPrioridadMedia =
    computed(() =>
      this.tareas().filter(
        tarea =>
          tarea.estado !== 'FINALIZADA'
          &&
          tarea.prioridad === 'MEDIA'
      )
    );


  readonly tareasPrioridadBaja =
    computed(() =>
      this.tareas().filter(
        tarea =>
          tarea.estado !== 'FINALIZADA'
          &&
          tarea.prioridad === 'BAJA'
      )
    );


  /*
   * =========================================================
   * PROYECTOS EN LOS QUE TRABAJO
   * =========================================================
   */

  readonly proyectosTrabajo =
    computed<ProyectoTrabajo[]>(() => {

      const proyectos =
        new Map<
          number,
          ProyectoTrabajo
        >();

      this.tareas().forEach(
        tarea => {

          let proyecto =
            proyectos.get(
              tarea.proyectoId
            );

          if (!proyecto) {

            proyecto = {
              id: tarea.proyectoId,
              nombre: tarea.proyectoNombre,
              tareasActivas: 0,
              tareasFinalizadas: 0
            };

            proyectos.set(
              tarea.proyectoId,
              proyecto
            );
          }

          if (
            tarea.estado === 'FINALIZADA'
          ) {

            proyecto.tareasFinalizadas++;

          } else {

            proyecto.tareasActivas++;
          }
        }
      );

      return Array.from(
        proyectos.values()
      );
    });


  readonly tareasProyectoSeleccionado =
    computed(() => {

      const proyectoId =
        this.proyectoSeleccionadoId();

      if (proyectoId === null) {

        return [];
      }

      return this.tareas().filter(
        tarea =>
          tarea.proyectoId
            === proyectoId
      );
    });


  readonly nombreProyectoSeleccionado =
    computed(() => {

      const proyectoId =
        this.proyectoSeleccionadoId();

      if (proyectoId === null) {

        return '';
      }

      return this.tareas().find(
        tarea =>
          tarea.proyectoId
            === proyectoId
      )?.proyectoNombre ?? '';
    });


  /*
   * =========================================================
   * LISTADO SEGÚN LA VISTA SELECCIONADA
   * =========================================================
   */

  readonly tareasVista =
    computed(() => {

      switch (
        this.vistaActiva()
      ) {

        case 'HOY':
          return this.tareasHoy();

        case 'EN_CURSO':
          return this.tareasEnCurso();

        case 'EN_PAUSA':
          return this.tareasEnPausa();

        case 'PENDIENTES':
          return this.tareasPendientes();

        case 'RETRASADAS':
          return this.tareasRetrasadas();

        case 'PRIORIDAD_ALTA':
          return this.tareasPrioridadAlta();

        case 'PRIORIDAD_MEDIA':
          return this.tareasPrioridadMedia();

        case 'PRIORIDAD_BAJA':
          return this.tareasPrioridadBaja();

        case 'HISTORICO':
          return this.tareasHistorico();

        case 'PROYECTO':
          return this.tareasProyectoSeleccionado();

        default:
          return [];
      }
    });


  /*
   * =========================================================
   * INICIALIZACIÓN
   * =========================================================
   */

  ngOnInit(): void {

    this.actualizarVista();
  }


  /*
   * =========================================================
   * CARGA
   * =========================================================
   */

  cargarTareas(): void {

    this.cargando.set(
      true
    );

    this.error.set(
      ''
    );

    this.tareaService
      .obtenerMisTareas()
      .pipe(
        finalize(() => {

          this.cargando.set(
            false
          );
        })
      )
      .subscribe({

        next: (tareas) => {

          this.tareas.set(
            tareas
          );

          this.validarProyectoSeleccionado(
            tareas
          );
        },

        error: () => {

          this.error.set(
            'No se han podido cargar las tareas.'
          );
        }
      });
  }


  cargarAvisosNoLeidos(): void {

    this.avisoTareaService
      .obtenerMisAvisosNoLeidos()
      .subscribe({

        next: (avisos) => {

          this.avisosNoLeidos.set(
            avisos.length
          );
        },

        error: () => {

          this.avisosNoLeidos.set(
            0
          );
        }
      });
  }


  actualizarVista(): void {

    this.cargarTareas();

    this.cargarAvisosNoLeidos();
  }


  /*
   * =========================================================
   * NAVEGACIÓN
   * =========================================================
   */

  seleccionarVista(
    vista: VistaTareas
  ): void {

    this.vistaActiva.set(
      vista
    );

    if (
      vista !== 'PROYECTO'
    ) {

      this.proyectoSeleccionadoId.set(
        null
      );
    }
  }


  abrirProyecto(
    proyectoId: number
  ): void {

    const existe =
      this.tareas().some(
        tarea =>
          tarea.proyectoId
            === proyectoId
      );

    if (!existe) {

      return;
    }

    this.proyectoSeleccionadoId.set(
      proyectoId
    );

    this.vistaActiva.set(
      'PROYECTO'
    );
  }


  volverAlPanel(): void {

    this.proyectoSeleccionadoId.set(
      null
    );

    this.vistaActiva.set(
      'RESUMEN'
    );
  }


  esVista(
    vista: VistaTareas
  ): boolean {

    return this.vistaActiva()
      === vista;
  }


  esVistaListado(): boolean {

    return [
      'HOY',
      'EN_CURSO',
      'EN_PAUSA',
      'PENDIENTES',
      'RETRASADAS',
      'PRIORIDAD_ALTA',
      'PRIORIDAD_MEDIA',
      'PRIORIDAD_BAJA',
      'HISTORICO',
      'PROYECTO'
    ].includes(
      this.vistaActiva()
    );
  }


  /*
   * =========================================================
   * ACCIONES DEL TRABAJADOR
   * =========================================================
   */

  iniciarTarea(
    tareaId: number
  ): void {

    this.ejecutarAccion(
      tareaId,
      this.tareaService.iniciarTarea(
        tareaId
      )
    );
  }


  pausarTarea(
    tareaId: number
  ): void {

    this.ejecutarAccion(
      tareaId,
      this.tareaService.pausarTarea(
        tareaId
      )
    );
  }


  finalizarTarea(
    tareaId: number
  ): void {

    this.ejecutarAccion(
      tareaId,
      this.tareaService.finalizarTarea(
        tareaId
      )
    );
  }


  guardarAclaracion(
    tareaId: number,
    aclaracion: string
  ): void {

    const texto =
      aclaracion.trim();

    if (!texto) {

      this.error.set(
        'La aclaración no puede estar vacía.'
      );

      return;
    }

    this.ejecutarAccion(
      tareaId,
      this.tareaService.guardarAclaracion(
        tareaId,
        texto
      )
    );
  }


  estaProcesando(
    tareaId: number
  ): boolean {

    return this.tareaProcesandoId()
      === tareaId;
  }


  esTareaRetrasada(
    tarea: Tarea
  ): boolean {

    if (
      tarea.estado === 'FINALIZADA'
    ) {

      return false;
    }

    return this.convertirFecha(
      tarea.fechaLimite
    ) < this.obtenerInicioHoy();
  }


  /*
   * =========================================================
   * ACTUALIZACIÓN DE UNA TAREA
   * =========================================================
   */

  private ejecutarAccion(
    tareaId: number,
    accion: Observable<Tarea>
  ): void {

    this.tareaProcesandoId.set(
      tareaId
    );

    this.error.set(
      ''
    );

    accion
      .pipe(
        finalize(() => {

          this.tareaProcesandoId.set(
            null
          );
        })
      )
      .subscribe({

        next: (
          tareaActualizada
        ) => {

          this.actualizarTarea(
            tareaActualizada
          );
        },

        error: () => {

          this.error.set(
            'No se ha podido realizar la operación.'
          );
        }
      });
  }


  private actualizarTarea(
    tareaActualizada: Tarea
  ): void {

    this.tareas.update(
      tareas =>
        tareas.map(
          tarea =>
            tarea.id
              === tareaActualizada.id
              ? tareaActualizada
              : tarea
        )
    );
  }


  /*
   * =========================================================
   * UTILIDADES
   * =========================================================
   */

  private validarProyectoSeleccionado(
    tareas: Tarea[]
  ): void {

    const proyectoId =
      this.proyectoSeleccionadoId();

    if (
      proyectoId === null
    ) {

      return;
    }

    const existe =
      tareas.some(
        tarea =>
          tarea.proyectoId
            === proyectoId
      );

    if (!existe) {

      this.proyectoSeleccionadoId.set(
        null
      );

      this.vistaActiva.set(
        'RESUMEN'
      );
    }
  }


  private obtenerInicioHoy(): number {

    const hoy =
      new Date();

    return new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate()
    ).getTime();
  }


  private convertirFecha(
    fecha: string
  ): number {

    const [
      dia,
      mes,
      anio
    ] =
      fecha
        .split('/')
        .map(Number);

    return new Date(
      anio,
      mes - 1,
      dia
    ).getTime();
  }
}