import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { ElasticsearchService } from 'src/app/elasticsearch.service';
import { debug } from 'util';



declare var $: any;

@Component({
  selector: 'app-index-list',
  templateUrl: './index-list.component.html',
  styleUrls: ['./index-list.component.css']
})
export class IndexListComponent implements OnInit {


  loaded = false;
  loaded2 = false;
  color = 'primary';
  value = 50;

  indices: any[];
  selectedIndex: string;
  newIndex: string;

  constructor(private elastic: ElasticsearchService) { }

  ngOnInit() {
    this.indexList();
    this.newIndex = '';

    this.elastic.indexSub.subscribe((index) => (this.selectedIndex = index));
  }



  private async indexList() {

    this.loaded = false;
    this.indices = await this.elastic.indexList();
    this.loaded = true;
    this.loaded2 = true;

  }


  onSelectIndex(index: string) {

    this.selectedIndex = index;
    console.debug("[IndexListComponent]   Se ha seleccionado el índice " + this.selectedIndex);
    this.elastic.setIndex(this.selectedIndex);

  }

  onCreateIndex(index: string) {
    this.loaded2 = false;
    this.elastic.createIndex(index)
      .then((response) => {
        console.debug("[IndexListComponent]   Índice " + index + " creado correctamente.");

        this.indexList();
      });
  }




}
