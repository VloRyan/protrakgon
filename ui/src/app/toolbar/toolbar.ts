import {Component, inject, input} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatGridList, MatGridTile} from '@angular/material/grid-list';
import {MatIconModule} from '@angular/material/icon';
import {SidebarService} from '../sidebar-service';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {RouteAction} from '../app.routes';
import {ReactiveFormsModule} from '@angular/forms';
import {AppConfigService} from '../app-config.service';

@Component({
  selector: 'app-toolbar',
  imports: [
    MatButton,
    MatGridList,
    MatGridTile,
    MatIconModule,
    MatIconButton,
    RouterLink,
    FaIconComponent,
    ReactiveFormsModule,
  ],
  template: `
    <mat-grid-list cols="3" rowHeight="50px">
      <mat-grid-tile>
        <button matIconButton (click)="this.sidebarService.toggleOpened()">
          <mat-icon>menu</mat-icon>
        </button>
        <a matButton [routerLink]="'/'">
          <div class="mat-h1">
            <img alt="logo" aria-hidden="true" class="brand-logo" height="32"
                                   [src]="appConfig.contextRoot()+'assets/icon.svg'" width="32"/>{{ this.appName() }}
          </div>
        </a>
        <div class="mat-h1">{{ RouteTitle() }}</div>
        <span class="toolbar-spacer"></span>
      </mat-grid-tile>
      <mat-grid-tile>
        @for (action of this.RouteActions(); track $index) {
          @switch (action.type){
            @case('submit'){
            <button matButton="outlined" type="submit" form="item-form">
            <fa-icon [icon]="action.icon"/>
              {{action.caption}}
              </button>
            }
            @case ('click'){
              <button matButton="outlined" (click)="action.click!== undefined?action.click($event,this.router):null">
                <fa-icon [icon]="action.icon"/>
                {{action.caption}}
              </button>
            }
          }

        }
      </mat-grid-tile>
      <mat-grid-tile>
        <span class="toolbar-spacer"></span>
      </mat-grid-tile>
    </mat-grid-list>
  `,
  styleUrl: './toolbar.scss',
})
export class Toolbar {
  appConfig = inject(AppConfigService);
  sidebarService: SidebarService = inject(SidebarService);
  appName = input<string>();
  router : Router = inject(Router);

  RouteTitle():string{
    let route = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.snapshot.title ?? ""
  }


  RouteActions():RouteAction[]{
    let route = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.snapshot.data["actions"] as RouteAction[] ?? []
  }
}
