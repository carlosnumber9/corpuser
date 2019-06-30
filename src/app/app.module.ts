import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { routing } from './app.routing';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MenuComponent } from './menu/menu.component';
import { UploadComponent } from './upload/upload.component';
import { StatsComponent } from './stats/stats.component';
import { NoPageFoundComponent } from './no-page-found/no-page-found.component';
import { TopicsGraphComponent } from './stats/topics-graph/topics-graph.component';
import { DocsPerYearGraphComponent } from './stats/docs-per-year-graph/docs-per-year-graph.component';
import { TitleListComponent } from './stats/title-list/title-list.component';


import { ElasticsearchService } from './elasticsearch.service';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { FileUploadModule } from 'ng2-file-upload';

import { HttpClientModule } from '@angular/common/http';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatProgressBarModule} from '@angular/material/progress-bar';

import { AngularResizedEventModule } from 'angular-resize-event';
import { NgDragDropModule } from 'ng-drag-drop';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule, MatInputModule  } from '@angular/material';
import { FilterPipe } from './filter.pipe';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IndexListComponent } from './menu/index-list/index-list.component';


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
    IndexListComponent
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
    FontAwesomeModule
  ],
  providers: [ElasticsearchService],
  bootstrap: [AppComponent]
})
export class AppModule { }
