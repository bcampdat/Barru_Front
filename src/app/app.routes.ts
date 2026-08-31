import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth-guard';
import { adminGuard } from './core/auth/admin-guard';
import { firstAccessGuard } from './core/auth/first-access-guard';
import { gestionGuard } from './core/auth/gestion-guard';
import { encargadoGuard } from './core/auth/encargado-guard';

import { Login } from './features/auth/login/login';
import { PrimerAcceso } from './features/auth/primer-acceso/primer-acceso';
import { RestablecerPassword } from './features/auth/restablecer-password/restablecer-password';
import { RecuperarPassword } from './features/auth/recuperar-password/recuperar-password';

import { Inicio } from './features/inicio/inicio';
import { Contenido } from './features/inicio/contenido/contenido';

import { Perfil } from './features/usuarios/perfil/perfil';
import { ListadoUsuarios } from './features/usuarios/listado-usuarios/listado-usuarios';
import { FormularioUsuario } from './features/usuarios/formulario-usuario/formulario-usuario';

import { ZonaAdminGestion } from './features/admin/gestion/zona-admin-gestion';

import { ListadoEmpresas } from './features/empresa/listado-empresas/listado-empresas';
import { FormularioEmpresa } from './features/empresa/formulario-empresa/formulario-empresa';

import { ListadoMetodosFichaje } from './features/metodo-fichaje/listado-metodos-fichaje/listado-metodos-fichaje';

import { ResumenPersonal } from './features/resumenes/personal/resumen-personal/resumen-personal';
import { ResumenEmpresa } from './features/resumenes/empresa/resumen-empresa/resumen-empresa';

import { Fichar } from './features/fichaje/fichar/fichar';

import { Notificaciones } from './features/notificaciones/notificaciones';
import { AvisosTarea } from './features/avisos-tarea/avisos-tarea';

import { Auditoria } from './features/auditoria/auditoria';

import { MisTareas } from './features/mis-tareas/mis-tareas';
import { PanelProyectos } from './features/panel-proyectos/panel-proyectos';


export const routes: Routes = [

  {
    path: 'login',
    component: Login,
  },

  {
    path: 'primer-acceso',
    component: PrimerAcceso,
    canActivate: [
      firstAccessGuard,
    ],
  },

  {
    path: 'restablecer-password',
    component: RestablecerPassword,
  },

  {
    path: 'recuperar-password',
    component: RecuperarPassword,
  },

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  {
    path: '',
    component: Inicio,
    canActivate: [
      authGuard,
    ],
    children: [

      {
        path: 'inicio',
        component: Contenido,
      },

      {
        path: 'perfil',
        component: Perfil,
      },

      {
        path: 'empresas',
        component: ListadoEmpresas,
        canActivate: [
          adminGuard,
        ],
      },

      {
        path: 'empresas/nueva',
        component: FormularioEmpresa,
        canActivate: [
          adminGuard,
        ],
      },

      {
        path: 'empresas/:id/editar',
        component: FormularioEmpresa,
        canActivate: [
          adminGuard,
        ],
      },

      {
        path: 'metodos-fichaje',
        component: ListadoMetodosFichaje,
        canActivate: [
          adminGuard,
        ],
      },

      {
        path: 'fichar',
        component: Fichar,
      },

      {
        path: 'mis-tareas',
        component: MisTareas,
      },

      {
        path: 'avisos-tarea',
        component: AvisosTarea,
      },

      {
        path: 'panel-proyectos',
        component: PanelProyectos,
        canActivate: [
          encargadoGuard,
        ],
      },

      {
        path: 'resumenes/mio',
        component: ResumenPersonal,
      },

      {
        path: 'resumenes/empresa',
        component: ResumenEmpresa,
        canActivate: [
          gestionGuard,
        ],
      },

      {
        path: 'auditoria',
        component: Auditoria,
        canActivate: [
          gestionGuard,
        ],
      },

      {
        path: 'notificaciones',
        component: Notificaciones,
        canActivate: [
          encargadoGuard,
        ],
      },

      {
        path: 'usuarios/nuevo',
        component: FormularioUsuario,
        canActivate: [
          gestionGuard,
        ],
      },

      {
        path: 'usuarios/:uuid/editar',
        component: FormularioUsuario,
        canActivate: [
          gestionGuard,
        ],
      },

      {
        path: 'usuarios',
        component: ListadoUsuarios,
        canActivate: [
          gestionGuard,
        ],
      },

      {
        path: 'admin',
        component: ZonaAdminGestion,
        canActivate: [
          adminGuard,
        ],
      },

    ],
  },

  {
    path: '**',
    redirectTo: 'login',
  },

];