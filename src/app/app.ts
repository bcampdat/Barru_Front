import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  AvisoHorasExtra,
} from './features/horas-extras/aviso-horas-extra/aviso-horas-extra';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    AvisoHorasExtra,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',

})
export class App {}