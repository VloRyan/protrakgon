import {Component, inject, signal} from '@angular/core';
import {MatCard, MatCardContent} from '@angular/material/card';
import {ActivatedRoute, Router} from '@angular/router';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {JsonApiService} from '../json-api.service';
import {DocumentForm, DocumentFormProps} from '../../../../../../ts/ts-jsonapi-form/form';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-client-detail',
  imports: [
    MatCard,
    MatCardContent,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <form id="item-form" (submit)="onSubmit($event)">
      <mat-card appearance="outlined">
        <mat-card-content>
          <mat-form-field [style.width.%]=49 [style.padding-right.%]="1">
            <mat-label>Name</mat-label>
            <input matInput name="name" [defaultValue]="form() != null ? form()?.getValue('name'):''"
                   (input)="onInput($event)">
          </mat-form-field>
          <mat-form-field [style.width.%]=49 [style.padding-left.%]="1">
            <mat-label>Description</mat-label>
            <input matInput name="description"
                   [defaultValue]="form() != null &&  form()?.getValue('description')? form()?.getValue('description'):''"
                   (input)="onInput($event)">
          </mat-form-field>
        </mat-card-content>
      </mat-card>
    </form>
  `,
  styleUrl: './client-detail.scss',
})
export class ClientDetail {
  route: ActivatedRoute = inject(ActivatedRoute);
  form = signal<DocumentForm | null>(null);
  jsonApiService: JsonApiService = inject(JsonApiService);
  router: Router = inject(Router);
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.jsonApiService.GetClient(this.route.snapshot.params['id']).then((doc) => {
      let theDoc = doc ? doc : null;
      let props = {
        document: theDoc,
        apiUrl: "api/v1/client" + (theDoc?.data.id ? "/" + theDoc!.data.id : ""),
        onSubmitSuccess: (object) => {
          this.snackBar.open('Client created successfully.', '', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
            duration: 3000,
          });
          this.router.navigate(["/client/", object.id]).then(
            () => {
              this.form.set(new DocumentForm({
                document: {...theDoc!, data: object},
                apiUrl: "api/v1/client/" + object.id
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
