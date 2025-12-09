import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterOutlet } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { SidebarService } from '../sidebar-service';
import { AppConfigService } from '../app-config.service';

@Component({
  selector: 'app-sidebar',
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav
        #sidenav
        mode="over"
        class="mat-elevation-z8"
        opened="{{ this.sidebarService.getOpened() }}"
        (openedChange)="this.onOpenChanged($event)"
      >
        <mat-nav-list>
          <a
            [routerLink]="'/client'"
            mat-list-item
            (click)="this.sidebarService.setOpened(false)"
          >
            <fa-icon [icon]="['fas', 'person']" />
            Client</a
          >
          <a
            [routerLink]="'/project'"
            mat-list-item
            (click)="this.sidebarService.setOpened(false)"
          >
            <fa-icon [icon]="['fas', 'list-ul']" />
            Project</a
          >
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content style="min-height: 300px">
        <router-outlet />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styleUrl: './sidebar.component.scss',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    FaIconComponent,
    RouterOutlet,
    RouterLink,
  ],
})
export class SidebarComponent {
  sidebarService: SidebarService = inject(SidebarService);
  appConfig = inject(AppConfigService);
  onOpenChanged(opened: boolean) {
    this.sidebarService.setOpened(opened);
  }
}
