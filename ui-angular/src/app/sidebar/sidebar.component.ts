import {Component, inject} from '@angular/core';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import {MatIconModule} from '@angular/material/icon';
import {RouterOutlet} from '@angular/router';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {SidebarService} from '../sidebar-service';


@Component({
  selector: 'app-sidebar',
  template: `
    <mat-sidenav-container class="sidenav-container" >
      <mat-sidenav #sidenav mode="side" class="mat-elevation-z8" opened="{{this.sidebarService.showSidebar}}">
        <mat-nav-list>
          <a href="/client" mat-list-item>
            <fa-icon [icon]="['fas', 'person']"/>
            Client</a>
          <a href="/project" mat-list-item>
            <fa-icon [icon]="['fas', 'list-ul']"/>
            Project</a>
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content style="min-height: 300px">
        <router-outlet/>
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
  ]
})
export class SidebarComponent {
  sidebarService: SidebarService = inject(SidebarService);
}
