import {Component, inject, signal} from '@angular/core';

import {ApiError, CollectionResourceDoc, ResourceObject} from '../../../../../../ts/ts-jsonapi-form/jsonapi/model';
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


@Component({
  selector: 'app-client',
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

  ],
  template: `
    <section class="results">
      <table mat-table class="results-table mat-elevation-z8" [dataSource]="itemList()">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef> Name </th>
          <td mat-cell *matCellDef="let item">{{item.attributes.name}}</td>
        </ng-container>
        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef> Description </th>
          <td mat-cell *matCellDef="let item">{{item.attributes.description}}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef style="text-align: right"></th>
          <td class="action-col" mat-cell *matCellDef="let item;" style="text-align: right; width: 100px; padding: 0">
            <span class="action-spacer"></span>
            <button matMiniFab  (click)="deleteItem($event, item.id)">
              <fa-icon [icon]="['fas', 'trash']"/>
            </button>
          </td>
        </ng-container>
        <tr mat-header-row  *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row class="row-hover" [routerLink]="['/client', item.id]" *matRowDef="let item; columns: displayedColumns;"></tr>
      </table>
    </section>
  `,
  styleUrl: './client.scss',
})
export class Client {
  displayedColumns: string[] = ['name', 'description', 'actions'];
  itemList = signal<ResourceObject[]>([]);
  jsonApiService: JsonApiService = inject(JsonApiService);
  private snackBar = inject(MatSnackBar);
  constructor() {
    this.jsonApiService.GetClients().then((doc: CollectionResourceDoc | undefined) => {
      this.itemList.set(doc ? doc.data : []);
    });
  }
  deleteItem(event:PointerEvent, id:string) {
    event.stopPropagation();
    this.jsonApiService.DeleteClient(id).then(_r => {
      this.snackBar.open('Client deleted','',{
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar'],
        duration: 3000,
      });
      this.jsonApiService.GetClients().then((doc: CollectionResourceDoc | undefined) => {
        this.itemList.set(doc ? doc.data : []);
      });
    }).catch((err)=>{
      if (err instanceof ApiError) {
        for (const oneError of (err as ApiError).errors){
          this.snackBar.open(oneError.title ? oneError.title : "Error occurred",'',{
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
            duration: 3000,
          });
          console.log(oneError.detail);
        }
      }else{
        console.log(err);
      }

    });
  }
}
