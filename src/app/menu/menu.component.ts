import { Component, OnInit, ElementRef } from '@angular/core';
import { Index } from '../index.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
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


  indices: Index[] = [];
  opciones = {
    headers: new HttpHeaders({
      'Content-Type' : "application/json"
    })
  }
  loaded: boolean;
  color = "primary";
  value = 50;
  mode = "indeterminate";



  constructor(private elastic: ElasticsearchService, private _element: ElementRef, private http: HttpClient) {
    this.loaded = false;
  }

  ngOnInit() {
    this.loaded = false;
    this.indexList();

    $('#iniciodiv').css('border', '1px solid black');
    $('#datosdiv').css('border', 'none');
    $('#statsdiv').css('border', 'none');



    setTimeout(function(){
      $('.menucontent').animate({opacity: 1}, 300);
    }, 500);



 }




 private async indexList() {

  this.indices = [];
  this.loaded = false;

  await this.elastic.indexList().then(response => {
    console.log("Conseguida la lista de índices.");
    console.log(response);

    for (let elem of response){
      this.indices.push({
        "index": elem['index'],
        "docs.count": elem['docs.count']
      })
    }

    this.loaded = true;

  });


}




fileover(event) {
  event.preventDefault();
  let dropzone = $("#dropzone");
  console.log("Fichero dentro del dropzone");
  dropzone.finish();
  dropzone.animate({border: "3px solid green"}, 300);

}


fileout(event) {

  event.preventDefault();
  let dropzone = $("#dropzone");
  dropzone.finish();
  dropzone.animate({border: "3px solid gray"}, 300);

}











}