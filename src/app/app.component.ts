import { Component, OnInit, ElementRef } from '@angular/core';
import { Index } from './index.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterOutlet } from '@angular/router';
import { fadeAnimation } from './animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [fadeAnimation]
})
export class AppComponent {
  title = 'Gestión de Corpus Documentales';


  constructor() { }

  public getRouterOutletState(outlet) {
    return outlet.isActivated ? outlet.activatedRoute : '';
  }






}
