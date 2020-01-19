import { Routes, RouterModule } from '@angular/router';
import { MenuComponent } from './views/menu/menu.component';
import { UploadComponent } from './views/upload/upload.component';
import { StatsComponent } from './views/stats/stats.component';
import { NoPageFoundComponent } from './views/no-page-found/no-page-found.component';

const appRoutes = [
    { path: '', component: MenuComponent, data: {animation: 'MenuPage'} },
    { path: 'upload/:index', component: UploadComponent, data: {animation: 'UploadPage'} },
    { path: 'stats/:index', component: StatsComponent, data: {animation: 'StatsPage'} },
    { path: '**', component: NoPageFoundComponent }
]


export const routing = RouterModule.forRoot(appRoutes);