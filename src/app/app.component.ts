import {Component, OnInit, HostListener } from '@angular/core';
import {fadeAnimation} from './animations';
import {ResizedEvent} from 'angular-resize-event';
import {Router} from '@angular/router';
import {ElasticsearchService} from './elasticsearch.service';
import { TranslateService } from '@ngx-translate/core';
import { CONSTANTS } from '../constants';

declare var $: any;

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    animations: [fadeAnimation]
})
export class AppComponent implements OnInit {


    // ---------------------------------------- ATTRIBUTES ----------------------------------------

    footer = $('footer');
    footerHeight = 0;
    footerTop = '0';
    selectedIndex: string;
    selectedLanguage: string = 'es';


    // ---------------------------------------- INIT METHODS ----------------------------------------


    constructor(public router: Router, public elastic: ElasticsearchService, public translate: TranslateService) {
        this.elastic.indexSub.subscribe((index) => (this.selectedIndex = index));
        this.setupi18n();
    }

    ngOnInit() {
        this.stickyFooter();
        setTimeout(function () {
            $('footer').fadeIn();
        }, 2000);
    }


    // ---------------------------------------- AUXILIARY METHODS ----------------------------------------


    setupi18n() {
        this.translate.addLangs([
            CONSTANTS.LANGUAGES.SPANISH.KEY,
            CONSTANTS.LANGUAGES.ENGLISH.KEY
        ]);
        this.translate.setDefaultLang(CONSTANTS.LANGUAGES.SPANISH.KEY);
        const localStorageLanguage = localStorage.getItem('language');
        const browserLanguage = (localStorageLanguage) ? localStorageLanguage : this.translate.getBrowserLang();
        this.selectedLanguage = (this.translate.getLangs().indexOf(browserLanguage)) ? browserLanguage : CONSTANTS.LANGUAGES.SPANISH.KEY;
        this.translate.use(this.selectedLanguage);
        localStorage.setItem('language', this.selectedLanguage);
    }

    getRouterOutletState(outlet: any) {
        return outlet.isActivated ? outlet.activatedRoute : '';
    }

    selectLanguage(language: string) {
        this.translate.use(language);
        localStorage.setItem('language', language);
    }

    /**
     * Method for app footer relocation
     */
    stickyFooter() {
        const footer = $('footer');
        const allBodyElements = $('body *');
        footer.css('opacity', 0);

        const contentLen = allBodyElements.outerHeight();
        const windowLen = $(window).height();
        const contentLen2 = allBodyElements.not('footer').not('#navbar2').outerHeight();

        if ((contentLen < windowLen) && ((windowLen - contentLen2) > footer.outerHeight())) {
            const off = $(window).scrollTop() + $(window).height();
            const sol = (contentLen2 > off) ? contentLen2 : off;
            footer
                .css({
                    'position': 'absolute',
                    'width': '100%',
                    'top': sol - footer.outerHeight()
                });
        } else {
            footer
                .css('position', 'relative')
                .css('top', '');
        }

        setTimeout(function () {
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
}