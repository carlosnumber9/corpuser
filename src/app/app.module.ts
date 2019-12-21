import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClientModule, HttpClient } from '@angular/common/http';

import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { routing } from './app.routing';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MenuComponent } from './views/menu/menu.component';
import { UploadComponent } from './views/upload/upload.component';
import { StatsComponent } from './views/stats/stats.component';
import { NoPageFoundComponent } from './views/no-page-found/no-page-found.component';
import { TopicsGraphComponent } from './fragments/topics-graph/topics-graph.component';
import { DocsPerYearGraphComponent } from './fragments/docs-per-year-graph/docs-per-year-graph.component';
import { TitleListComponent } from './fragments/title-list/title-list.component';


import { ElasticsearchService } from './elasticsearch.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { FileUploadModule } from 'ng2-file-upload';

import { NgxChartsModule } from '@swimlane/ngx-charts';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatProgressBarModule} from '@angular/material/progress-bar';

import { AngularResizedEventModule } from 'angular-resize-event';
import { NgDragDropModule } from 'ng-drag-drop';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule, MatInputModule  } from '@angular/material';
import { FilterPipe } from './filter.pipe';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IndexListComponent } from './fragments/index-list/index-list.component';
import { LoadingSpinnerComponent } from './fragments/loading-spinner/loading-spinner.component';



export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, '../assets/i18n/', '.json');
}




@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    UploadComponent,
    StatsComponent,
    FilterPipe,
    NoPageFoundComponent,
    TopicsGraphComponent,
    DocsPerYearGraphComponent,
    TitleListComponent,
    IndexListComponent,
    LoadingSpinnerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    routing,
    FormsModule,
    ReactiveFormsModule,
    FileUploadModule,
    HttpClientModule,
    BrowserAnimationsModule,
    NgxChartsModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    RouterModule,
    AngularResizedEventModule,
    NgDragDropModule.forRoot(),
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    FontAwesomeModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  providers: [ElasticsearchService],
  bootstrap: [AppComponent]
})
export class AppModule { }
