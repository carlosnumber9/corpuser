import { Component, Input } from '@angular/core';

@Component({
  selector: 'loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.css']
})
export class LoadingSpinnerComponent {

  @Input('loaded') private loaded: boolean;

  color = 'primary';
  value = 50;
  mode = 'indeterminate';

  constructor() { }

}
