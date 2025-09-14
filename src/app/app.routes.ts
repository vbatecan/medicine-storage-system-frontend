import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'pharmacist/home',
    loadComponent: () => import('./routes/pharmacist/home/pharmacist-home.component').then(m => m.PharmacistHome)
  },
  {
    path: 'kiosk/interface',
    loadComponent: () => import('./routes/kiosk/kiosk-interface/kiosk-interface').then(m => m.KioskInterface)
  }
];
