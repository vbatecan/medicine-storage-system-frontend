import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'pharmacist/home',
    loadComponent: () => import('./routes/pharmacist/home/home').then(m => m.Home)
  },
  {
    path: 'kiosk/interface',
    loadComponent: () => import('./routes/kiosk/kiosk-interface/kiosk-interface').then(m => m.KioskInterface)
  }
];
