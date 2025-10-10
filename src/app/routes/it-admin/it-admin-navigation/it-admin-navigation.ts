import { Component, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-it-admin-navigation',
  standalone: true,
  imports: [CommonModule, MenubarModule],
  templateUrl: './it-admin-navigation.html',
  styleUrl: './it-admin-navigation.css'
})
export class ItAdminNavigation {
  private router = inject(Router);

  // Signal for current active route
  activeRoute = signal('');

  // Menu items for the navigation
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'fas fa-home',
      routerLink: '/it-admin/home',
      routerLinkActiveOptions: { exact: true }
    },
    {
      label: 'Transaction History',
      icon: 'fas fa-history',
      routerLink: '/it-admin/transactions',
      routerLinkActiveOptions: { exact: true }
    }
  ];

  constructor() {
    // Track active route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.activeRoute.set(event.url);
      });

    // Set initial active route
    this.activeRoute.set(this.router.url);
  }
}
