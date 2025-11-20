import {Component, inject, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {DocumentForm, DocumentFormProps} from '../../../../../../ts/ts-jsonapi-form/form';
import {JsonApiService} from '../json-api.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatCheckbox} from '@angular/material/checkbox';


@Component({
  selector: 'app-activity-detail-component',
  imports: [
    MatCard,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatInput,
    MatCheckbox
  ],
  template: `
    <form id="item-form" (submit)="onSubmit($event)">
      <mat-card appearance="outlined">
        <mat-card-content>
          <mat-form-field floatLabel="always" [style.width.%]=49 [style.padding-right.%]="1">
            <mat-label>Name</mat-label>
            <input matInput name="name" [defaultValue]="form() != null ? form()?.getValue('name')??'':''"
                   (input)="onInput($event)">
          </mat-form-field>
          <mat-form-field floatLabel="always" [style.width.%]=49 [style.padding-left.%]="1">
            <mat-label>Icon</mat-label>
            <input matInput name="icon"
                   [defaultValue]="form() != null &&  form()?.getValue('icon')? form()?.getValue('icon'):''"
                   (input)="onInput($event)">
          </mat-form-field>
          <br/>
          <div class="mat-mdc-form-field" [style.width.%]=49 [style.padding-right.%]="1">
            <span>
            <mat-label>Billable</mat-label>
            <mat-checkbox type="checkbox" name="billable" [checked]="form() != null ? form()?.getValue('billable'):''"
                          (input)="onInput($event)"></mat-checkbox>
              </span>
          </div>
          <mat-form-field floatLabel="always" [style.width.%]=49  [style.padding-left.%]="1">
            <mat-label>Amount</mat-label>
            <input type="number" matInput name="amount"
                   [defaultValue]="form() != null &&  form()?.getValue('amount')? form()?.getValue('amount'):''"
                   (input)="onInput($event)">
          </mat-form-field>
          <br/>
          <mat-form-field floatLabel="always" [style.width.%]=100>
            <mat-label>Description</mat-label>
            <textarea matNativeControl name="description" rows="2"
                      [defaultValue]="form() != null &&  form()?.getValue('description')? form()?.getValue('description'):''"
                      (input)="onInput($event)"></textarea>
          </mat-form-field>
        </mat-card-content>
      </mat-card>
    </form>
  `,
  styleUrl: './activity-detail-component.scss',
})
export class ActivityDetailComponent {
  route: ActivatedRoute = inject(ActivatedRoute);
  form = signal<DocumentForm | null>(null);
  jsonApiService: JsonApiService = inject(JsonApiService);
  router: Router = inject(Router);
  private snackBar = inject(MatSnackBar);

  constructor() {
    let projectId = this.route.snapshot.params['project-id'];
    this.jsonApiService.GetProjectActivity(projectId, this.route.snapshot.params['id']).then((doc) => {
      let theDoc = doc ? doc : null;
      let props = {
        document: theDoc,
        apiUrl: "api/v1/project/" + projectId + "/activity" + (theDoc?.data.id ? "/" + theDoc!.data.id : ""),
        onSubmitSuccess: (object) => {
          this.snackBar.open('Activity created successfully.', '', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
            duration: 3000,
          });
          this.router.navigate(["/project" ,projectId , "activity", object.id]).then(
            () => {
              this.form.set(new DocumentForm({
                document: {...theDoc!, data: object},
                apiUrl: "api/v1/project/" + projectId + "/activity/" + object.id
              }                      satisfies DocumentFormProps));
            }
          );
        },
        onSubmitError: (error) => {
          this.snackBar.open('Failed to crate client: ' + error.message, '', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
            duration: 3000,
          });
        }
      } satisfies DocumentFormProps;
      let form = new DocumentForm(props);
      this.form.set(form);
    });
  }

  onInput(ev: Event) {

    this.form()?.handleChangeEvent(ev);
  }

  onSubmit(ev: Event) {
    this.form()?.handleSubmit(ev)
  }

}
