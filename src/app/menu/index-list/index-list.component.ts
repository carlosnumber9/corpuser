import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { ElasticsearchService } from 'src/app/elasticsearch.service';



declare var $: any;

@Component({
  selector: 'app-index-list',
  templateUrl: './index-list.component.html',
  styleUrls: ['./index-list.component.css']
})
export class IndexListComponent implements OnInit {


  loaded = false;
  color = 'primary';
  value = 50;

  indices: any[];
  selectedIndex: string;

  constructor(private elastic: ElasticsearchService) { }

  ngOnInit() {
    this.indexList();
    this.elastic.getIndex().subscribe((index) => (this.selectedIndex = index));
  }



  private async indexList() {

    this.loaded = false;
    this.indices = await this.elastic.indexList();
    this.loaded = true;

  }


  onSelectIndex(index: string) {

    if(this.selectedIndex) { $('#li' + this.selectedIndex).removeClass('selected-index') }
    $('#li' + index).addClass('selected-index');
    this.selectedIndex = index;
    this.elastic.setIndex(this.selectedIndex);
    console.log(this.selectedIndex);

  }




}
