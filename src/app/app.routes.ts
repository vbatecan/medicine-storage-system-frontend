import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'pharmacist/home',
    loadComponent: () => import('./routes/pharmacist/home/pharmacist-home.component').then(m => m.PharmacistHomeComponent)
  },
  {
    path: 'kiosk/interface',
    loadComponent: () => import('./routes/kiosk/kiosk-interface/kiosk-interface').then(m => m.KioskInterface)
  },
  {
    path: 'it-admin/home',
    loadComponent: () => import('./routes/it-admin/it-admin-home/it-admin-home').then(m => m.ItAdminHome)
  }
];
