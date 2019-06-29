import { Routes, RouterModule } from '@angular/router';
import { MenuComponent } from './menu/menu.component';
import { UploadComponent } from './upload/upload.component';
import { StatsComponent } from './stats/stats.component';
import { NoPageFoundComponent } from './no-page-found/no-page-found.component';

const appRoutes = [
    { path: '', component: MenuComponent, data: {animation: 'MenuPage'} },
    { path: 'upload/:index', component: UploadComponent, data: {animation: 'UploadPage'} },
    { path: 'stats/:index', component: StatsComponent, data: {animation: 'StatsPage'} },
    { path: '**', component: NoPageFoundComponent }
]


export const routing = RouterModule.forRoot(appRoutes);