import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { FormControl } from '@angular/forms';
import { startWith, map } from 'rxjs/operators';

@Component({
  selector: 'item-search-bar',
  templateUrl: './item-search-bar.component.html',
  styleUrls: ['./item-search-bar.component.css']
})
export class ItemSearchBarComponent implements OnInit {

  @Input('total-item-list') private totalItemList: string[];
  @Input('selected-items-list') private selectedItemsList: string[];

  @Output() itemWasSelected: EventEmitter<string[]> = new EventEmitter<string[]>();

  myControl = new FormControl();
  options: string[] = [];
  filteredOptions: Observable<string[]>;
  filteredValue: string[];
  searchText = '';

  ngOnInit() {
    this.filteredOptions = this.myControl.valueChanges
      .pipe(
        startWith(''),
        map(value => this._filter(value, this.totalItemList))
      );
  }

  private addItem(itemToAdd: string) {
    let index = this.selectedItemsList.indexOf(itemToAdd);
    if(index < 0) {
      this.selectedItemsList.push(itemToAdd);
    }
    else {
      this.selectedItemsList.splice(index, 1);
    }
    this.itemWasSelected.emit(this.selectedItemsList);
  }

  private _filter(value: string, opciones: string[]): string[] {
    const filterValue = value.toLowerCase();
    return opciones.filter((option: string) => option.toLowerCase().includes(filterValue));
  }
}
