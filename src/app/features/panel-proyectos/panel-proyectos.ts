import {
  Component,
  computed,
  inject,
  OnInit,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  Router
} from '@angular/router';

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
  ProyectoService
} from '../../core/proyecto/proyecto-service';

import {
  CrearProyectoRequest,
  Proyecto
} from '../../core/proyecto/proyecto-types';

import {
  CrearTareaRequest,
  TareaService
} from '../../core/proyecto/tarea/tarea-service';

import {
  Tarea
} from '../../core/proyecto/tarea/tarea-types';

import {
  UsuarioService
} from '../../core/usuarios/usuario-service';

import {
  RolAsignableDTO,
  UserDTO
} from '../../core/usuarios/usuario.types';


type VistaPanel =
  | 'RESUMEN'
  | 'PROYECTOS_ACTIVOS'
  | 'TAREAS'
  | 'PENDIENTES'
  | 'EN_CURSO'
  | 'EN_PAUSA'
  | 'FINALIZADAS'
  | 'RETRASADAS'
  | 'SIN_ASIGNAR'
  | 'PRIORIDAD_ALTA'
  | 'PRIORIDAD_MEDIA'
  | 'PRIORIDAD_BAJA'
  | 'HISTORICO'
  | 'PROYECTO';


@Component({
  selector: 'app-panel-proyectos',
  imports: [
    FormsModule,
    ButtonModule,
    MessageModule,
    TagModule
  ],
  templateUrl: './panel-proyectos.html',
  styleUrl: './panel-proyectos.scss'
})
export class PanelProyectos implements OnInit {

  private readonly router =
    inject(Router);

  private readonly avisoTareaService =
    inject(AvisoTareaService);

  private readonly proyectoService =
    inject(ProyectoService);

  private readonly tareaService =
    inject(TareaService);

  private readonly usuarioService =
    inject(UsuarioService);


  /*
   * =========================================================
   * DATOS PRINCIPALES
   * =========================================================
   */

  readonly proyectos =
    signal<Proyecto[]>([]);

  readonly tareasEmpresa =
    signal<Tarea[]>([]);

  readonly usuariosEmpresa =
    signal<UserDTO[]>([]);

  readonly usuariosAsignables =
    signal<UserDTO[]>([]);

  readonly avisosNoLeidos =
    signal(0);


  /*
   * =========================================================
   * NAVEGACIÓN DEL PANEL
   * =========================================================
   */

  readonly vistaActiva =
    signal<VistaPanel>('RESUMEN');

  readonly proyectoSeleccionadoId =
    signal<number | null>(null);


  /*
   * =========================================================
   * ESTADOS DE INTERFAZ
   * =========================================================
   */

  readonly cargando =
    signal(false);

  readonly creandoProyecto =
    signal(false);

  readonly proyectoProcesandoId =
    signal<number | null>(null);

  readonly tareaProcesandoId =
    signal<number | null>(null);

  readonly creandoTareaProyectoId =
    signal<number | null>(null);

  readonly formularioTareaProyectoId =
    signal<number | null>(null);

  readonly formularioFechaProyectoId =
    signal<number | null>(null);

  readonly mostrarFormularioProyecto =
    signal(false);

  readonly error =
    signal('');


  /*
   * =========================================================
   * DATOS DE FORMULARIOS
   * =========================================================
   */

  usuarioSeleccionadoPorTarea:
    Partial<Record<number, string>> = {};

  fechaFinEstimadaPorProyecto:
    Partial<Record<number, string>> = {};

  nuevoProyecto:
    CrearProyectoRequest = {
      nombre: '',
      fechaInicio: '',
      fechaFinEstimada: ''
    };

  nuevaTarea:
    CrearTareaRequest = {
      nombre: '',
      notas: null,
      prioridad: 'MEDIA',
      fechaLimite: '',
      usuarioAsignadoUuid: null
    };


  /*
   * =========================================================
   * RESUMEN GLOBAL
   * =========================================================
   */

  readonly proyectosActivos =
    computed(() =>
      this.proyectos().filter(
        proyecto =>
          proyecto.fechaFin === null
      )
    );

  readonly proyectosFinalizados =
    computed(() =>
      this.proyectos().filter(
        proyecto =>
          proyecto.fechaFin !== null
      )
    );

  readonly tareasPendientes =
    computed(() =>
      this.tareasEmpresa().filter(
        tarea =>
          tarea.estado === 'SIN_INICIAR'
      )
    );

  readonly tareasEnCurso =
    computed(() =>
      this.tareasEmpresa().filter(
        tarea =>
          tarea.estado === 'INICIADA'
      )
    );

  readonly tareasEnPausa =
    computed(() =>
      this.tareasEmpresa().filter(
        tarea =>
          tarea.estado === 'PAUSA'
      )
    );

  readonly tareasFinalizadas =
    computed(() =>
      this.tareasEmpresa().filter(
        tarea =>
          tarea.estado === 'FINALIZADA'
      )
    );

  readonly tareasSinAsignar =
    computed(() =>
      this.tareasEmpresa().filter(
        tarea =>
          tarea.usuarioAsignadoUuid === null
      )
    );

  readonly tareasRetrasadas =
    computed(() =>
      this.tareasEmpresa().filter(
        tarea =>
          this.esTareaRetrasada(
            tarea
          )
      )
    );


  /*
   * Las prioridades representan trabajo pendiente,
   * por lo que no mezclamos aquí tareas finalizadas.
   */

  readonly tareasPrioridadAlta =
    computed(() =>
      this.tareasEmpresa().filter(
        tarea =>
          tarea.estado !== 'FINALIZADA'
          &&
          tarea.prioridad === 'ALTA'
      )
    );

  readonly tareasPrioridadMedia =
    computed(() =>
      this.tareasEmpresa().filter(
        tarea =>
          tarea.estado !== 'FINALIZADA'
          &&
          tarea.prioridad === 'MEDIA'
      )
    );

  readonly tareasPrioridadBaja =
    computed(() =>
      this.tareasEmpresa().filter(
        tarea =>
          tarea.estado !== 'FINALIZADA'
          &&
          tarea.prioridad === 'BAJA'
      )
    );


  /*
   * =========================================================
   * PROYECTO SELECCIONADO
   * =========================================================
   */

  readonly proyectoSeleccionado =
    computed(() => {

      const proyectoId =
        this.proyectoSeleccionadoId();

      if (proyectoId === null) {

        return null;
      }

      return this.proyectos().find(
        proyecto =>
          proyecto.id === proyectoId
      ) ?? null;
    });


  readonly tareasProyectoSeleccionado =
    computed(() => {

      const proyectoId =
        this.proyectoSeleccionadoId();

      if (proyectoId === null) {

        return [];
      }

      return this.tareasEmpresa().filter(
        tarea =>
          tarea.proyectoId === proyectoId
      );
    });


  /*
   * =========================================================
   * DATOS SEGÚN LA PIEZA DEL DASHBOARD SELECCIONADA
   * =========================================================
   */

  readonly proyectosVista =
    computed(() => {

      switch (
        this.vistaActiva()
      ) {

        case 'PROYECTOS_ACTIVOS':
          return this.proyectosActivos();

        case 'HISTORICO':
          return this.proyectosFinalizados();

        default:
          return [];
      }
    });


  readonly tareasVista =
    computed(() => {

      switch (
        this.vistaActiva()
      ) {

        case 'TAREAS':
          return this.tareasEmpresa();

        case 'PENDIENTES':
          return this.tareasPendientes();

        case 'EN_CURSO':
          return this.tareasEnCurso();

        case 'EN_PAUSA':
          return this.tareasEnPausa();

        case 'FINALIZADAS':
          return this.tareasFinalizadas();

        case 'RETRASADAS':
          return this.tareasRetrasadas();

        case 'SIN_ASIGNAR':
          return this.tareasSinAsignar();

        case 'PRIORIDAD_ALTA':
          return this.tareasPrioridadAlta();

        case 'PRIORIDAD_MEDIA':
          return this.tareasPrioridadMedia();

        case 'PRIORIDAD_BAJA':
          return this.tareasPrioridadBaja();

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

    this.actualizarPanel();
  }


  /*
   * =========================================================
   * CARGA DEL DASHBOARD
   * =========================================================
   */

  actualizarPanel(): void {

    this.cargarPanel();

    this.cargarAvisosNoLeidos();
  }


  cargarPanel(): void {

    this.cargando.set(
      true
    );

    this.error.set(
      ''
    );

    forkJoin({

      proyectos:
        this.proyectoService
          .obtenerProyectosEmpresa(),

      tareas:
        this.tareaService
          .obtenerTareasEmpresa()

    })
      .pipe(
        finalize(() => {

          this.cargando.set(
            false
          );
        })
      )
      .subscribe({

        next: ({
          proyectos,
          tareas
        }) => {

          this.proyectos.set(
            proyectos
          );

          this.tareasEmpresa.set(
            tareas
          );

          this.validarProyectoSeleccionado(
            proyectos
          );

          if (
            proyectos.length > 0
            &&
            this.usuariosEmpresa().length === 0
          ) {

            this.cargarUsuariosEmpresa(
              proyectos[0].empresaId
            );
          }
        },

        error: () => {

          this.error.set(
            'No se han podido cargar los datos del panel.'
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


  /*
   * =========================================================
   * NAVEGACIÓN
   * =========================================================
   */

  abrirAvisos(): void {

    void this.router.navigate(
      ['/avisos-tarea']
    );
  }


  seleccionarVista(
    vista: VistaPanel
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

      this.cerrarFormulariosProyecto();
    }
  }


  abrirProyecto(
    proyectoId: number
  ): void {

    const existe =
      this.proyectos().some(
        proyecto =>
          proyecto.id === proyectoId
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

    this.cerrarFormulariosProyecto();
  }


  volverAlPanel(): void {

    this.proyectoSeleccionadoId.set(
      null
    );

    this.vistaActiva.set(
      'RESUMEN'
    );

    this.cerrarFormulariosProyecto();
  }


  esVista(
    vista: VistaPanel
  ): boolean {

    return this.vistaActiva()
      === vista;
  }


  esVistaTareas(): boolean {

    return [
      'TAREAS',
      'PENDIENTES',
      'EN_CURSO',
      'EN_PAUSA',
      'FINALIZADAS',
      'RETRASADAS',
      'SIN_ASIGNAR',
      'PRIORIDAD_ALTA',
      'PRIORIDAD_MEDIA',
      'PRIORIDAD_BAJA'
    ].includes(
      this.vistaActiva()
    );
  }


  /*
   * =========================================================
   * CREAR PROYECTO
   * =========================================================
   */

  alternarFormularioProyecto(): void {

    this.mostrarFormularioProyecto.update(
      mostrar =>
        !mostrar
    );

    this.error.set(
      ''
    );

    if (
      !this.mostrarFormularioProyecto()
    ) {

      this.limpiarFormularioProyecto();
    }
  }


  crearProyecto(): void {

    const nombre =
      this.nuevoProyecto.nombre.trim();

    const fechaInicio =
      this.nuevoProyecto.fechaInicio.trim();

    const fechaFinEstimada =
      this.nuevoProyecto.fechaFinEstimada.trim();

    if (
      !nombre
      ||
      !fechaInicio
      ||
      !fechaFinEstimada
    ) {

      this.error.set(
        'Completa todos los datos del proyecto.'
      );

      return;
    }

    const proyectoRequest:
      CrearProyectoRequest = {

        nombre,
        fechaInicio,
        fechaFinEstimada
      };

    this.error.set(
      ''
    );

    this.creandoProyecto.set(
      true
    );

    this.proyectoService
      .crearProyecto(
        proyectoRequest
      )
      .pipe(
        finalize(() => {

          this.creandoProyecto.set(
            false
          );
        })
      )
      .subscribe({

        next: (proyectoCreado) => {

          const eraPrimerProyecto =
            this.proyectos().length === 0;

          this.proyectos.update(
            proyectos => [
              proyectoCreado,
              ...proyectos
            ]
          );

          this.mostrarFormularioProyecto.set(
            false
          );

          this.limpiarFormularioProyecto();

          if (
            eraPrimerProyecto
          ) {

            this.cargarUsuariosEmpresa(
              proyectoCreado.empresaId
            );
          }

          this.abrirProyecto(
            proyectoCreado.id
          );
        },

        error: () => {

          this.error.set(
            'No se ha podido crear el proyecto.'
          );
        }
      });
  }


  /*
   * =========================================================
   * CREAR TAREA
   * =========================================================
   */

  alternarFormularioTarea(
    proyectoId: number
  ): void {

    if (
      this.formularioTareaProyectoId()
      === proyectoId
    ) {

      this.formularioTareaProyectoId.set(
        null
      );

      this.limpiarFormularioTarea();

      return;
    }

    this.error.set(
      ''
    );

    this.formularioTareaProyectoId.set(
      proyectoId
    );

    this.limpiarFormularioTarea();
  }


  mostrarFormularioTarea(
    proyectoId: number
  ): boolean {

    return this.formularioTareaProyectoId()
      === proyectoId;
  }


  crearTarea(
    proyectoId: number
  ): void {

    const nombre =
      this.nuevaTarea.nombre.trim();

    const fechaLimite =
      this.nuevaTarea.fechaLimite.trim();

    if (
      !nombre
      ||
      !fechaLimite
    ) {

      this.error.set(
        'El nombre y la fecha límite de la tarea son obligatorios.'
      );

      return;
    }

    const tareaRequest:
      CrearTareaRequest = {

        nombre,

        notas:
          this.nuevaTarea.notas?.trim()
          || null,

        prioridad:
          this.nuevaTarea.prioridad,

        fechaLimite,

        usuarioAsignadoUuid:
          this.nuevaTarea.usuarioAsignadoUuid
          || null
      };

    this.error.set(
      ''
    );

    this.creandoTareaProyectoId.set(
      proyectoId
    );

    this.tareaService
      .crearTarea(
        proyectoId,
        tareaRequest
      )
      .pipe(
        finalize(() => {

          this.creandoTareaProyectoId.set(
            null
          );
        })
      )
      .subscribe({

        next: () => {

          this.formularioTareaProyectoId.set(
            null
          );

          this.limpiarFormularioTarea();

          /*
           * Se recarga porque si el encargado se asigna
           * la tarea, deja de gestionar ese proyecto.
           */
          this.actualizarPanel();
        },

        error: () => {

          this.error.set(
            'No se ha podido crear la tarea.'
          );
        }
      });
  }


  estaCreandoTarea(
    proyectoId: number
  ): boolean {

    return this.creandoTareaProyectoId()
      === proyectoId;
  }


  /*
   * =========================================================
   * ASIGNAR TAREA
   * =========================================================
   */

  asignarTarea(
    tareaId: number
  ): void {

    const usuarioUuid =
      this.usuarioSeleccionadoPorTarea[
        tareaId
      ];

    if (
      !usuarioUuid
    ) {

      this.error.set(
        'Selecciona un trabajador.'
      );

      return;
    }

    this.error.set(
      ''
    );

    this.tareaProcesandoId.set(
      tareaId
    );

    this.tareaService
      .asignarTarea(
        tareaId,
        usuarioUuid
      )
      .pipe(
        finalize(() => {

          this.tareaProcesandoId.set(
            null
          );
        })
      )
      .subscribe({

        next: () => {

          delete this
            .usuarioSeleccionadoPorTarea[
              tareaId
            ];

          /*
           * La asignación puede hacer que el encargado
           * pase a actuar como trabajador del proyecto.
           */
          this.actualizarPanel();
        },

        error: () => {

          this.error.set(
            'No se ha podido asignar la tarea.'
          );
        }
      });
  }


  /*
   * =========================================================
   * AMPLIAR PLAZO
   * =========================================================
   */

  alternarFormularioFecha(
    proyecto: Proyecto
  ): void {

    if (
      this.formularioFechaProyectoId()
      === proyecto.id
    ) {

      this.formularioFechaProyectoId.set(
        null
      );

      delete this
        .fechaFinEstimadaPorProyecto[
          proyecto.id
        ];

      return;
    }

    this.error.set(
      ''
    );

    this.formularioFechaProyectoId.set(
      proyecto.id
    );

    this.fechaFinEstimadaPorProyecto[
      proyecto.id
    ] = '';
  }


  mostrarFormularioFecha(
    proyectoId: number
  ): boolean {

    return this.formularioFechaProyectoId()
      === proyectoId;
  }


  ampliarFechaFinEstimada(
    proyectoId: number
  ): void {

    const nuevaFecha =
      this.fechaFinEstimadaPorProyecto[
        proyectoId
      ]?.trim();

    if (
      !nuevaFecha
    ) {

      this.error.set(
        'Indica la nueva fecha estimada.'
      );

      return;
    }

    this.error.set(
      ''
    );

    this.proyectoProcesandoId.set(
      proyectoId
    );

    this.proyectoService
      .ampliarFechaFinEstimada(
        proyectoId,
        nuevaFecha
      )
      .pipe(
        finalize(() => {

          this.proyectoProcesandoId.set(
            null
          );
        })
      )
      .subscribe({

        next: (proyectoActualizado) => {

          this.actualizarProyectoLocal(
            proyectoActualizado
          );

          this.formularioFechaProyectoId.set(
            null
          );

          delete this
            .fechaFinEstimadaPorProyecto[
              proyectoId
            ];
        },

        error: () => {

          this.error.set(
            'No se ha podido ampliar la fecha estimada.'
          );
        }
      });
  }


  /*
   * =========================================================
   * FINALIZAR PROYECTO
   * =========================================================
   */

  finalizarProyecto(
    proyectoId: number
  ): void {

    this.error.set(
      ''
    );

    this.proyectoProcesandoId.set(
      proyectoId
    );

    this.proyectoService
      .finalizarProyecto(
        proyectoId
      )
      .pipe(
        finalize(() => {

          this.proyectoProcesandoId.set(
            null
          );
        })
      )
      .subscribe({

        next: (proyectoFinalizado) => {

          this.actualizarProyectoLocal(
            proyectoFinalizado
          );

          this.cerrarFormulariosProyecto();
        },

        error: () => {

          this.error.set(
            'No se ha podido finalizar el proyecto. Comprueba que todas sus tareas estén finalizadas.'
          );
        }
      });
  }


  /*
   * =========================================================
   * CONSULTAS PARA LA VISTA
   * =========================================================
   */

  obtenerTareasProyecto(
    proyectoId: number
  ): Tarea[] {

    return this.tareasEmpresa().filter(
      tarea =>
        tarea.proyectoId === proyectoId
    );
  }


  obtenerNombreUsuario(
    usuarioUuid: string | null
  ): string {

    if (
      !usuarioUuid
    ) {

      return 'Sin asignar';
    }

    const usuario =
      this.usuariosEmpresa().find(
        candidato =>
          candidato.uuid === usuarioUuid
      );

    if (
      !usuario
    ) {

      return 'Usuario no disponible';
    }

    return `${usuario.nombre} ${usuario.apellidos}`
      .trim();
  }


  estaProcesandoProyecto(
    proyectoId: number
  ): boolean {

    return this.proyectoProcesandoId()
      === proyectoId;
  }


  estaProcesandoTarea(
    tareaId: number
  ): boolean {

    return this.tareaProcesandoId()
      === tareaId;
  }


  proyectoFinalizado(
    proyecto: Proyecto
  ): boolean {

    return proyecto.fechaFin
      !== null;
  }


  tareasPendientesProyecto(
    proyectoId: number
  ): Tarea[] {

    return this.obtenerTareasProyecto(
      proyectoId
    ).filter(
      tarea =>
        tarea.estado === 'SIN_INICIAR'
    );
  }


  tareasEnCursoProyecto(
    proyectoId: number
  ): Tarea[] {

    return this.obtenerTareasProyecto(
      proyectoId
    ).filter(
      tarea =>
        tarea.estado === 'INICIADA'
    );
  }


  tareasEnPausaProyecto(
    proyectoId: number
  ): Tarea[] {

    return this.obtenerTareasProyecto(
      proyectoId
    ).filter(
      tarea =>
        tarea.estado === 'PAUSA'
    );
  }


  tareasFinalizadasProyecto(
    proyectoId: number
  ): Tarea[] {

    return this.obtenerTareasProyecto(
      proyectoId
    ).filter(
      tarea =>
        tarea.estado === 'FINALIZADA'
    );
  }


  tareasSinAsignarProyecto(
    proyectoId: number
  ): Tarea[] {

    return this.obtenerTareasProyecto(
      proyectoId
    ).filter(
      tarea =>
        tarea.usuarioAsignadoUuid === null
    );
  }


  tareasRetrasadasProyecto(
    proyectoId: number
  ): Tarea[] {

    return this.obtenerTareasProyecto(
      proyectoId
    ).filter(
      tarea =>
        this.esTareaRetrasada(
          tarea
        )
    );
  }


  progresoProyecto(
    proyectoId: number
  ): number {

    const tareas =
      this.obtenerTareasProyecto(
        proyectoId
      );

    if (
      tareas.length === 0
    ) {

      return 0;
    }

    const finalizadas =
      tareas.filter(
        tarea =>
          tarea.estado === 'FINALIZADA'
      ).length;

    return Math.round(
      finalizadas
      * 100
      / tareas.length
    );
  }


  trabajadoresProyecto(
    proyectoId: number
  ): number {

    const usuarios =
      this.obtenerTareasProyecto(
        proyectoId
      )
        .map(
          tarea =>
            tarea.usuarioAsignadoUuid
        )
        .filter(
          (uuid): uuid is string =>
            uuid !== null
        );

    return new Set(
      usuarios
    ).size;
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
   * USUARIOS
   * =========================================================
   */

  private cargarUsuariosEmpresa(
    empresaId: number
  ): void {

    forkJoin({

      usuarios:
        this.usuarioService
          .listarPorEmpresa(
            empresaId
          ),

      usuariosActivos:
        this.usuarioService
          .listarPorEmpresaYEstado(
            empresaId,
            'ACTIVO'
          ),

      roles:
        this.usuarioService
          .listarRolesAsignables()

    }).subscribe({

      next: ({
        usuarios,
        usuariosActivos,
        roles
      }) => {

        this.usuariosEmpresa.set(
          usuarios
        );

        this.usuariosAsignables.set(
          this.filtrarUsuariosAsignables(
            usuariosActivos,
            roles
          )
        );
      },

      error: () => {

        this.error.set(
          'No se han podido cargar los trabajadores de la empresa.'
        );
      }
    });
  }


  private filtrarUsuariosAsignables(
    usuarios: UserDTO[],
    roles: RolAsignableDTO[]
  ): UserDTO[] {

    const rolesTrabajador =
      new Set(
        roles
          .filter(
            rol =>
              rol.nombre.toUpperCase()
                === 'EMPLEADO'
              ||
              rol.nombre.toUpperCase()
                === 'ENCARGADO'
          )
          .map(
            rol =>
              rol.id
          )
      );

    return usuarios.filter(
      usuario =>
        usuario.uuid != null
        &&
        rolesTrabajador.has(
          usuario.rolId
        )
    );
  }


  /*
   * =========================================================
   * UTILIDADES
   * =========================================================
   */

  private validarProyectoSeleccionado(
    proyectos: Proyecto[]
  ): void {

    const proyectoId =
      this.proyectoSeleccionadoId();

    if (
      proyectoId === null
    ) {

      return;
    }

    const sigueGestionable =
      proyectos.some(
        proyecto =>
          proyecto.id === proyectoId
      );

    if (
      !sigueGestionable
    ) {

      this.proyectoSeleccionadoId.set(
        null
      );

      this.vistaActiva.set(
        'RESUMEN'
      );

      this.cerrarFormulariosProyecto();
    }
  }


  private actualizarProyectoLocal(
    proyectoActualizado: Proyecto
  ): void {

    this.proyectos.update(
      proyectos =>
        proyectos.map(
          proyecto =>
            proyecto.id
              === proyectoActualizado.id
              ? proyectoActualizado
              : proyecto
        )
    );
  }


  private cerrarFormulariosProyecto(): void {

    this.formularioTareaProyectoId.set(
      null
    );

    this.formularioFechaProyectoId.set(
      null
    );
  }


  private limpiarFormularioProyecto(): void {

    this.nuevoProyecto = {
      nombre: '',
      fechaInicio: '',
      fechaFinEstimada: ''
    };
  }


  private limpiarFormularioTarea(): void {

    this.nuevaTarea = {
      nombre: '',
      notas: null,
      prioridad: 'MEDIA',
      fechaLimite: '',
      usuarioAsignadoUuid: null
    };
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