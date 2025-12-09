import { Component, inject } from '@angular/core';
import { JsonApiService } from '../json-api.service';
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
  MatTable,
} from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatMiniFabButton } from '@angular/material/button';
import { DocumentTableComponent } from '../document-form/document-table-component';
import {
  CollectionResourceDoc,
  Document as ApiDocument,
  PrimaryData,
} from '@vloryan/ts-jsonapi-form/jsonapi/model';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

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
    MatProgressSpinner,
  ],
  template: `
    @if (isLoading()) {
      <mat-spinner></mat-spinner>
    } @else {
      <section class="results">
        <table
          mat-table
          class="results-table mat-elevation-z8"
          [dataSource]="rows()"
        >
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Name</th>
            <td mat-cell *matCellDef="let item">{{ item.attributes.name }}</td>
          </ng-container>
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>Description</th>
            <td mat-cell *matCellDef="let item">
              {{ item.attributes.description }}
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th
              mat-header-cell
              *matHeaderCellDef
              style="text-align: right"
            ></th>
            <td
              class="action-col"
              mat-cell
              *matCellDef="let item"
              style="text-align: right; width: 100px; padding: 0"
            >
              <span class="action-spacer"></span>
              <button matMiniFab (click)="deleteItem($event, item.id)">
                <fa-icon [icon]="['fas', 'trash']" />
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr
            mat-row
            class="row-hover"
            [routerLink]="['/client', item.id]"
            *matRowDef="let item; columns: displayedColumns"
          ></tr>
        </table>
      </section>
    }
  `,
  styleUrl: './client.scss',
})
export class Client extends DocumentTableComponent {
  displayedColumns: string[] = ['name', 'description', 'actions'];
  jsonApiService: JsonApiService = inject(JsonApiService);

  constructor() {
    super('Client');
  }

  protected override loadDocument(): Promise<
    CollectionResourceDoc | undefined
  > {
    return this.jsonApiService.GetClients();
  }

  protected override deleteObject(
    id: string,
  ): Promise<ApiDocument<PrimaryData> | null> {
    return this.jsonApiService.DeleteClient(id);
  }
}
