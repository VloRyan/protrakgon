import {Component, inject, OnInit, signal} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {DocumentForm, DocumentFormProps} from '../../../../../../ts/ts-jsonapi-form/form';
import {JsonApiService} from '../json-api.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatSelect} from '@angular/material/select';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {ResourceObject} from '../../../../../../ts/ts-jsonapi-form/jsonapi/model';


@Component({
  selector: 'app-slot-detail-component',
  imports: [
    MatCard,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatInput,
    FaIconComponent
  ],
  template: `

      <mat-card appearance="outlined">
        <mat-card-content>
          <form id="item-form" (submit)="onSubmit($event)">
          <mat-form-field floatLabel="always" [style.width.%]=49 [style.padding-right.%]="1">
            <mat-label>Activity</mat-label>
            <select matNativeControl name="activity.id" #activitySelect (input)="onInput($event)">
              @for (activity of this.activities(); track $index) {
                @if (this.form()?.getValue("activity.id") == activity.id) {
                  <option [value]="activity.id" selected>
                    <fa-icon [icon]="['fas', (activity.attributes!['icon']! +'')]" [style.padding-right.px]="2"/>
                    {{ activity.attributes!['name'] }}
                  </option>
                } @else {
                  <option [value]="activity.id">
                    <fa-icon [icon]="['fas', (activity.attributes!['icon']! +'')]" [style.padding-right.px]="2"/>
                    {{ activity.attributes!['name'] }}
                  </option>
                }
              }
            </select>
          </mat-form-field>
          <mat-form-field floatLabel="always" [style.width.%]=24 [style.padding-right.%]="1">
            <mat-label>Start</mat-label>
            <input matInput name="start" type="datetime-local" [defaultValue]="formValueAsLocalDateTime('start')"
                   (input)="onInput($event)">
          </mat-form-field>
          <mat-form-field floatLabel="always" [style.width.%]=24 [style.padding-left.%]="1">
            <mat-label>End</mat-label>
            <input matInput name="end" type="datetime-local"
                   [defaultValue]="formValueAsLocalDateTime('end')"
                   (input)="onInput($event)">
          </mat-form-field>
          <br/>
          <mat-form-field floatLabel="always" [style.width.%]=100>
            <mat-label>Description</mat-label>
            <textarea matNativeControl name="description" rows="2"
                      [defaultValue]="form() != null &&  form()?.getValue('description')? form()?.getValue('description'):''"
                      (input)="onInput($event)"></textarea>
          </mat-form-field>
          </form>
        </mat-card-content>
      </mat-card>

  `,
  styleUrl: './slot-detail-component.scss',
})
export class SlotDetailComponent implements OnInit {
  activitySelect = new MatSelect();
  route: ActivatedRoute = inject(ActivatedRoute);
  form = signal<DocumentForm | null>(null);
  jsonApiService: JsonApiService = inject(JsonApiService);
  router: Router = inject(Router);
  activities= signal<ResourceObject[]>([]);

  private snackBar = inject(MatSnackBar);

  constructor() {
    let projectId = this.route.snapshot.params['project-id'];
    this.jsonApiService.GetProjectSlot(projectId, this.route.snapshot.params['id']).then((doc) => {
      let theDoc = doc ? doc : null;
      let props = {
        document: theDoc,
        apiUrl: "api/v1/project/" + projectId + "/slot" + (theDoc?.data.id ? "/" + theDoc!.data.id : ""),
        onSubmitSuccess: (object) => {
          this.snackBar.open('Activity created successfully.', '', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
            duration: 3000,
          });
          this.router.navigate(["/project" ,projectId , "slot", object.id]).then(
            () => {
              this.form.set(new DocumentForm({
                document: {...theDoc!, data: object},
                apiUrl: "api/v1/project/" + projectId + "/slot/" + object.id
              }                      satisfies DocumentFormProps));
            }
          );
        },
        onSubmitError: (error) => {
          this.snackBar.open('Failed to create slot: ' + error.message, '', {
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

ngOnInit() {
  let projectId = this.route.snapshot.params['project-id'];
  this.jsonApiService.GetProjectActivities(projectId).then((doc) => {
    let theDoc = doc ? doc : null;
    this.activities.set(theDoc?.data??[]);
    this.activitySelect.value = this.form()?.getValue("activity.id")!= undefined?this.form()?.getValue("activity.id"):null;
  });
}

  onInput(ev: Event) {

    this.form()?.handleChangeEvent(ev);
  }

  onSubmit(ev: Event) {
    this.form()?.handleSubmit(ev)
  }
  formValueAsLocalDateTime(name:string){
    let value =this.form()?.getValue(name) as string|undefined;
    if(!value){
      return null;
    }
    let date = new Date(value);
    return date.toISOString().substring(0,11)+date.toLocaleTimeString().substring(0,5);
  }
}
