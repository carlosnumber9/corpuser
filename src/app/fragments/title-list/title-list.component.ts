import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'title-list',
  templateUrl: './title-list.component.html',
  styleUrls: ['./title-list.component.css']
})
export class TitleListComponent implements OnInit {

  nFilter = new FormControl();

  @Input('total-title-list') totalTitleList: Object[] = [];
  @Input('filtered-id-list') filteredIdList: string[];
  @Input('filtered-title-id-list') filteredTitleIdList: string[];

  @Output() titleWasSelected: EventEmitter<number> = new EventEmitter<number>();

  /**
     * Verifies wheter the document is included inside active filters
     * @param title Document to verify
     */
  isDocumentIncluded(title: any): boolean {
    let ids = (this.filteredTitleIdList.length == 0) ? this.filteredIdList : this.filteredTitleIdList;
    return ids.includes(title.id);
  }

  /**
   * Makes Stats Component aware of new title selection
   * @param titleId new selected title ID
   */
  selectTitle(titleId: number) {
    this.titleWasSelected.emit(titleId);
  }

  constructor() { }

  ngOnInit() {
  }
}
