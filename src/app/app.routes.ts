import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth-guard';
import { adminGuard } from './core/auth/admin-guard';
import { firstAccessGuard } from './core/auth/first-access-guard';

import { Login } from './features/auth/login/login';
import { PrimerAcceso } from './features/auth/primer-acceso/primer-acceso';
import { RestablecerPassword } from './features/auth/restablecer-password/restablecer-password';
import { RecuperarPassword } from './features/auth/recuperar-password/recuperar-password';
import { Inicio } from './features/inicio/inicio';
import { Perfil } from './features/usuarios/perfil/perfil'; 
import { ZonaAdminGestion } from './features/admin/gestion/zona-admin-gestion';


import { ListadoEmpresas } from './features/empresa/listado-empresas/listado-empresas';
import { FormularioEmpresa } from './features/empresa/formulario-empresa/formulario-empresa';
import { ListadoMetodosFichaje } from './features/metodo-fichaje/listado-metodos-fichaje/listado-metodos-fichaje';
import { ResumenPersonal } from './features/resumenes/personal/resumen-personal/resumen-personal';
import { ResumenEmpresa } from './features/resumenes/empresa/resumen-empresa/resumen-empresa';

import { gestionGuard } from './core/auth/gestion-guard';
import { ListadoUsuarios } from './features/usuarios/listado-usuarios/listado-usuarios';
import { FormularioUsuario } from './features/usuarios/formulario-usuario/formulario-usuario';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'primer-acceso',
    component: PrimerAcceso,
    canActivate: [firstAccessGuard],
  },
  {
    path: 'inicio',
    component: Inicio,
    canActivate: [authGuard],
  },

  {
    path: 'perfil',
    component: Perfil,
    canActivate: [authGuard],
  },

  {
    path: 'empresas',
    component: ListadoEmpresas,
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'empresas/nueva',
    component: FormularioEmpresa,
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'empresas/:id/editar',
    component: FormularioEmpresa,
    canActivate: [authGuard, adminGuard],
  },

  {
    path: 'metodos-fichaje',
    component: ListadoMetodosFichaje,
    canActivate: [authGuard, adminGuard],
  },

  {
    path: 'resumenes/mio',
    component: ResumenPersonal,
    canActivate: [authGuard],
  },
  {
    path: 'resumenes/empresa',
    component: ResumenEmpresa,
    canActivate: [
      authGuard,
      gestionGuard,
    ],
  },
 
  {
    path: 'usuarios/nuevo',
    component: FormularioUsuario,
    canActivate: [
      authGuard,
      gestionGuard,
    ],
  },
  {
    path: 'usuarios/:uuid/editar',
    component: FormularioUsuario,
    canActivate: [
      authGuard,
      gestionGuard,
    ],
  },
  {
    path: 'usuarios',
    component: ListadoUsuarios,
    canActivate: [
      authGuard,
      gestionGuard,
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
    path: 'admin',
    component: ZonaAdminGestion,
    canActivate: [authGuard, adminGuard],
  },

  {
    path: '**',
    redirectTo: 'login',
  },
];