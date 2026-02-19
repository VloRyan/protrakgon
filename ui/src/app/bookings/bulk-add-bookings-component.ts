import { Component, inject, model } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormField, MatInput } from '@angular/material/input';
import { JsonApiService } from '../json-api.service';

export interface DialogData {
  projectId: string;
}
@Component({
  selector: 'app-bulk-add-bookings-component',
  imports: [
    MatButton,
    FormsModule,
    MatDialogContent,
    MatFormField,
    MatDialogActions,
    MatDialogTitle,
    MatInput,
  ],
  template: `
    <h2 mat-dialog-title xmlns="http://www.w3.org/1999/html">Add bookings</h2>
    <mat-dialog-content>
      <mat-form-field [style.width.%]="100">
        <textarea
          matInput
          placeholder="Format(tab separated): Activity, Start, End, Description"
          [(ngModel)]="value"
          rows="4"
        ></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button matButton (click)="onCancelClicked()">Cancel</button>
      <button matButton (click)="onOkClicked()">Ok</button>
    </mat-dialog-actions>
  `,
})
export class BulkAddBookingsComponent {
  readonly dialogRef = inject(MatDialogRef<BulkAddBookingsComponent>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  readonly value = model('');

  jsonApiService: JsonApiService = inject(JsonApiService);

  onCancelClicked(): void {
    this.dialogRef.close();
  }
  onOkClicked(): void {
    if (this.value().length == 0) {
      this.dialogRef.close();
    }
    this.jsonApiService
      .AddBookingsBulk(this.data.projectId, this.value())
      .then(() => this.dialogRef.close());
  }
}
