import {Component, inject, signal} from '@angular/core';

import {
  ApiError,
  CollectionResourceDoc,
  Included,
  ResourceObject
} from '../../../../../../ts/ts-jsonapi-form/jsonapi/model';
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
import {MatSnackBar} from '@angular/material/snack-bar';
import {ProjectClientCell} from './client.cell.component';
import {MatGridList, MatGridTile} from '@angular/material/grid-list';
import {TrackSlotButton} from './track-slot-button';


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
      <table mat-table class="results-table mat-elevation-z8" [dataSource]="itemList()">
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
          <th mat-header-cell *matHeaderCellDef ></th>
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
export class ProjectComponent {
  displayedColumns: string[] = ['name', 'client', 'description', 'actions'];
  itemList = signal<ResourceObject[]>([]);
  jsonApiService: JsonApiService = inject(JsonApiService);
included : Included|undefined = undefined;
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.jsonApiService.GetProjects().then((doc: CollectionResourceDoc | undefined) => {
      this.included = doc?.included;
      this.itemList.set(doc ? doc.data : []);

    });
  }

  deleteItem(event: PointerEvent, id: string) {
    event.stopPropagation();
    this.jsonApiService.DeleteProject(id).then(_r => {
      this.snackBar.open('Project deleted', '', {
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar'],
        duration: 3000,
      });
      this.jsonApiService.GetClients().then((doc: CollectionResourceDoc | undefined) => {
        this.itemList.set(doc ? doc.data : []);
      });
    }).catch((err) => {
      if (err instanceof ApiError) {
        for (const oneError of (err as ApiError).errors) {
          this.snackBar.open(oneError.title ? oneError.title : "Error occurred", '', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
            duration: 3000,
          });
          console.log(oneError.detail);
        }
      } else {
        console.log(err);
      }

    });
  }
}

