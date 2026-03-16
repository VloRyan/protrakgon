import { Component } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ProjectsWidgetComponent } from './widget/projects-widget.component';
import { NgComponentOutlet } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  template: `<div class="grid-container">
    <mat-grid-list cols="2" rowHeight="350px">
      @for (card of cards; track card) {
        <mat-grid-tile [colspan]="card.cols" [rowspan]="card.rows">
          <mat-card class="dashboard-card">
            <mat-card-header>
              <mat-card-title>
                {{ card.title }}
                <button
                  [matMenuTriggerFor]="menu"
                  aria-label="Toggle menu"
                  class="more-button"
                  matIconButton
                >
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #menu="matMenu" xPosition="before">
                  <button mat-menu-item>Expand</button>
                  <button mat-menu-item>Remove</button>
                </mat-menu>
              </mat-card-title>
            </mat-card-header>
            <mat-card-content class="dashboard-card-content">
              @if (card.content) {
                <ng-container *ngComponentOutlet="card.content" />
              }
            </mat-card-content>
          </mat-card>
        </mat-grid-tile>
      }
    </mat-grid-list>
  </div>`,
  styleUrl: './dashboard.component.scss',
  imports: [
    MatGridListModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    NgComponentOutlet,
  ],
})
export class DashboardComponent {
  cards = [
    {
      title: 'Projects',
      cols: 2,
      rows: 1,
      content: ProjectsWidgetComponent,
    },
  ];
  protected readonly ProjectsWidgetComponent = ProjectsWidgetComponent;
}
