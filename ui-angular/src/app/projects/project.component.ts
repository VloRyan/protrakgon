import {Component, inject} from '@angular/core';

import {Document, Included, PrimaryData} from '../../../../../../ts/ts-jsonapi-form/jsonapi/model';
import {JsonApiService} from '../json-api.service';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable
} from '@angular/material/table';
import {RouterLink} from '@angular/router';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {MatMiniFabButton} from '@angular/material/button';
import {ProjectClientCell} from './client.cell.component';
import {MatGridList, MatGridTile} from '@angular/material/grid-list';
import {TrackSlotButton} from './track-slot-button';
import {DocumentTableComponent} from '../document-form/document-table-component';


@Component({
  selector: 'app-project',
  imports: [
    MatTable,
    MatHeaderCell,
    MatCell,
    MatColumnDef,
    MatHeaderCellDef,
    MatCellDef,
    MatHeaderRow,
    MatRow,
    MatRowDef,
    MatHeaderRowDef,
    RouterLink,
    FaIconComponent,
    MatMiniFabButton,
    ProjectClientCell,
    ProjectClientCell,
    ProjectClientCell,
    MatGridList,
    MatGridTile,
    TrackSlotButton,

  ],
  template: `
    <section class="results">
      <table mat-table class="results-table mat-elevation-z8" [dataSource]="rows()">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef> Name</th>
          <td mat-cell *matCellDef="let item">{{ item.attributes.name }}</td>
        </ng-container>
        <ng-container matColumnDef="client">
          <th mat-header-cell *matHeaderCellDef> Client</th>
          <td mat-cell *matCellDef="let item">
            <app-project-client-cell [item]="item" [included]="included"></app-project-client-cell>
          </td>
        </ng-container>
        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef> Description</th>
          <td mat-cell *matCellDef="let item">{{ item.attributes.description }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td class="action-col" mat-cell *matCellDef="let item;" style="text-align: right; width: 100px; padding: 0">
            <span class="action-spacer"></span>
            <mat-grid-list cols="2" style="width: 100px" rowHeight="40px">
              <mat-grid-tile>
                <app-track-slot-button [projectId]="item.id"></app-track-slot-button>
              </mat-grid-tile>
              <mat-grid-tile>
                <button matMiniFab (click)="deleteItem($event, item.id)">
                  <fa-icon [icon]="['fas', 'trash']"/>
                </button>
              </mat-grid-tile>
            </mat-grid-list>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row class="row-hover" [routerLink]="['/project', item.id]"
            *matRowDef="let item; columns: displayedColumns;"></tr>
      </table>
    </section>
  `,
  styleUrl: './project.component.scss',
})
export class ProjectComponent extends DocumentTableComponent {
  displayedColumns: string[] = ['name', 'client', 'description', 'actions'];
  jsonApiService: JsonApiService = inject(JsonApiService);
  included: Included | undefined = undefined;

  constructor() {
    super("Project");
  }

  override async loadDocument() {
    const doc = await this.jsonApiService.GetProjects();
    if (doc) {
      this.included = doc.included;
    }
    return doc;
  }

  protected override deleteObject(id: string): Promise<Document<PrimaryData> | null> {
    return this.jsonApiService.DeleteProject(id);
  }
}

