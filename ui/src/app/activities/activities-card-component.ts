import {Component, inject, input} from '@angular/core';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {JsonApiService} from '../json-api.service';
import {
  CollectionResourceDoc,
  Document as ApiDocument,
  PrimaryData
} from '@vloryan/ts-jsonapi-form/jsonapi/model';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
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
import {MatButton, MatMiniFabButton} from '@angular/material/button';
import {RouterLink} from '@angular/router';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {DocumentTableComponent} from '../document-form/document-table-component';

@Component({
  selector: 'app-activities-card-component',
  imports: [
    MatCard,
    MatCardHeader,
    FaIconComponent,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatMiniFabButton,
    MatRow,
    MatTable,
    RouterLink,
    MatProgressSpinner,
    MatCardContent,
    MatHeaderCellDef,
    MatRowDef,
    MatCardTitle,
    MatButton,

  ],
  template: `
    <mat-card appearance="outlined">
      <mat-card-header>
        <mat-card-title>Activities</mat-card-title>
        <span class="toolbar-spacer"></span>
        <a [routerLink]="['/project',this.projectId(),'activity','new']" matButton="outlined">
          <fa-icon [icon]="['fas', 'plus']"/>
        </a>
      </mat-card-header>
      <mat-card-content>
        @if (isLoading()) {
          <mat-spinner></mat-spinner>
        } @else {
          <table mat-table class="results-table mat-elevation-z8" [dataSource]="rows()">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef> Name</th>
              <td mat-cell *matCellDef="let item"><fa-icon [icon]="['fas', item.attributes.icon]" [style.padding-right.px]="2"/>{{ item.attributes.name }}</td>
            </ng-container>
            <ng-container matColumnDef="billable">
              <th mat-header-cell *matHeaderCellDef> Billable</th>
              <td mat-cell *matCellDef="let item">@if (item.attributes.billable) {
                <fa-icon [icon]="['fas', 'money-bill-1']"/>
                {{ toCurrency(item.attributes.amount, "€") }}
              }
              </td>
            </ng-container>
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef> Description</th>
              <td mat-cell *matCellDef="let item">{{ item.attributes.description }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef style="text-align: right"></th>
              <td class="action-col" mat-cell *matCellDef="let item;" style="text-align: right">
                <span class="action-spacer"></span>
                <button matMiniFab (click)="deleteItem($event, item.id)">
                  <fa-icon [icon]="['fas', 'trash']"/>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row class="row-hover" [routerLink]="['/project',this.projectId(),'activity', item.id]"
                *matRowDef="let item; columns: displayedColumns;"></tr>
          </table>
        }
      </mat-card-content>
    </mat-card>
  `,
  styleUrl: './activities-card-component.scss',
})
export class ActivitiesCardComponent extends DocumentTableComponent {
  displayedColumns: string[] = ['name', 'billable', 'description', 'actions'];
  jsonApiService: JsonApiService = inject(JsonApiService);
  projectId = input.required<string>();
  constructor() {
    super("Activity");
  }

  toCurrency(num: number | undefined, currency: string): string {
    if (!num) {
      num = 0;
    }
    return (
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num) +
      " " +
      currency
    );
  }

  protected override loadDocument(): Promise<CollectionResourceDoc | undefined> {
    return this.jsonApiService.GetProjectActivities(this.projectId());
  }

  protected override deleteObject(id: string): Promise<ApiDocument<PrimaryData> | null> {
    return this.jsonApiService.DeleteActivity(this.projectId(), id);
  }
}
