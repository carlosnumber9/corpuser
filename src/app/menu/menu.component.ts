import { Component, OnInit, ElementRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ElasticsearchService } from '../elasticsearch.service';
import { fadeAnimation } from '../animations';

declare var $: any;

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  animations: [ fadeAnimation ]
})
export class MenuComponent implements OnInit {


  opciones = {
    headers: new HttpHeaders({
      'Content-Type' : 'application/json'
    })
  }
  loaded: boolean;



  constructor(private elastic: ElasticsearchService, private _element: ElementRef, private http: HttpClient) {
  }

  ngOnInit() {
    this.loaded = false;

    $('#iniciodiv').css('border', '1px solid black');
    $('#datosdiv').css('border', 'none');
    $('#statsdiv').css('border', 'none');

    setTimeout(function(){
      $('.menucontent').animate({opacity: 1}, 300);
    }, 500);

 }



fileover(event) {
  event.preventDefault();
  const dropzone = $('#dropzone');
  console.log('Fichero dentro del dropzone');
  dropzone.finish();
  dropzone.animate({border: '3px solid green'}, 300);

}


fileout(event) {

  event.preventDefault();
  const dropzone = $('#dropzone');
  dropzone.finish();
  dropzone.animate({border: '3px solid gray'}, 300);

}

}