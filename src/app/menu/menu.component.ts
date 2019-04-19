import { Component, OnInit, ElementRef } from '@angular/core';
import { Index } from '../index.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { ElasticsearchService } from '../elasticsearch.service';
import { fadeAnimation } from '../animations';



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

    /*
    setInterval(() => {
      this.indices = this.indexList();
    }, 5000);
    */



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







}