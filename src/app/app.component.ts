import { Component, OnInit, ElementRef, HostListener, OnChanges, SimpleChanges } from '@angular/core';

import { fadeAnimation } from './animations';

import { ResizedEvent } from 'angular-resize-event';
import { ActivatedRoute, Router } from '@angular/router';

import { routing } from './app.routing';


declare var $: any;


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [fadeAnimation]
})
export class AppComponent implements OnInit {
  title = 'Gestión de Corpus Documentales';

  footer = $('footer');
  footerHeight = 0;
  footerTop = '0';




  constructor(private router: Router) { }

  public getRouterOutletState(outlet) {
    return outlet.isActivated ? outlet.activatedRoute : '';
  }






  stickyFooter(){

    let footer = $('footer');

    footer.css('opacity', 0);


    let contentLen = $('body *').outerHeight();
    let windowLen = $(window).height();
    let contentLen2 = $('body *').not('footer').not('#navbar2').outerHeight();

    if((contentLen < windowLen) && ((windowLen - contentLen2) > footer.outerHeight())) {

      let off = $(window).scrollTop() + $(window).height();
      let sol = (contentLen2 > off) ? contentLen2 : off;

      footer
        .css({
          'position': 'absolute',
          'width': '100%',
          'top': sol - footer.outerHeight()});

    }
    else {

      footer
        .css('position', 'relative')
        .css('top', '');
    }


    setTimeout(function(){
      footer.animate({'opacity': 1});
    }, 1000);


  }






  onResized(event: ResizedEvent) {
    this.stickyFooter();
  }





  @HostListener('window:resize', ['$event'])
    onResize(event) {
      this.stickyFooter();
  }







  ngOnInit(){

    this.stickyFooter();

    setTimeout(function(){
      $('footer').fadeIn();
    }, 2000);

    let that = this;

    $('.boton').on('click',function() {
      switch($(this).attr('id')){
        case 'iniciodiv':
          that.router.navigate(['']);
          break;
        case 'datosdiv':
          console.log("Entrando en upload...");
          that.router.navigate(['upload']);
          break;
        case 'statsdiv':
          that.router.navigate(['stats']);
          break;
        default: 
          break;
      }
    });






  }


  



}