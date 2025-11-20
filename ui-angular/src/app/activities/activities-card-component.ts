import {Component, inject, input, OnInit, signal} from '@angular/core';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {JsonApiService} from '../json-api.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ApiError, CollectionResourceDoc, ResourceObject} from '../../../../../../ts/ts-jsonapi-form/jsonapi/model';
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
          <table mat-table class="results-table mat-elevation-z8" [dataSource]="itemList()">
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
export class ActivitiesCardComponent implements OnInit {
  displayedColumns: string[] = ['name', 'billable', 'description', 'actions'];
  projectId = input.required<string>();
  jsonApiService: JsonApiService = inject(JsonApiService);
  itemList = signal<ResourceObject[]>([]);
  isLoading = signal<boolean>(false);
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.isLoading.set(true);
  }

  ngOnInit(): void {
    this.jsonApiService.GetProjectActivities(this.projectId()).then((doc: CollectionResourceDoc | undefined) => {
      this.itemList.set(doc ? doc.data : []);
      this.isLoading.set(false);
    });
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

  deleteItem(event: PointerEvent, id: string) {
    event.stopPropagation();
    this.jsonApiService.DeleteActivity(this.projectId(), id).then(_r => {
      this.snackBar.open('Activity deleted', '', {
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar'],
        duration: 3000,
      });
      this.isLoading.set(true);
      this.jsonApiService.GetProjectActivities(this.projectId()).then((doc: CollectionResourceDoc | undefined) => {
        this.itemList.set(doc ? doc.data : []);
        this.isLoading.set(false);
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
