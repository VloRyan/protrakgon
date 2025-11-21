import {Component, inject, signal} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {JsonApiService} from '../json-api.service';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatSelect} from '@angular/material/select';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {ResourceObject, SingleResourceDoc} from '@vloryan/ts-jsonapi-form/jsonapi/model';
import {DocumentFormComponent} from '../document-form/document-form-component';


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
                @if (formValue("activity.id") == activity.id) {
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
                      [defaultValue]="formValue('description')"
                      (input)="onInput($event)"></textarea>
          </mat-form-field>
          </form>
        </mat-card-content>
      </mat-card>

  `,
  styleUrl: './slot-detail-component.scss',
})
export class SlotDetailComponent extends DocumentFormComponent {
  activitySelect = new MatSelect();
  activities= signal<ResourceObject[]>([]);
  route: ActivatedRoute = inject(ActivatedRoute);
  jsonApiService: JsonApiService = inject(JsonApiService);

  constructor() {
    super("Slot", "", "")
    const projectId = this.route.snapshot.params['project-id'];
    this.baseUrl = "project/" + projectId + "/slot"
    this.baseApiUrl = "project/" + projectId + "/slot"
  }

  override ngOnInit() {
    super.ngOnInit();
    let projectId = this.route.snapshot.params['project-id'];
    this.jsonApiService.GetProjectActivities(projectId).then((doc) => {
      let theDoc = doc ? doc : null;
      this.activities.set(theDoc?.data??[]);
      this.activitySelect.value = this.form()?.getValue("activity.id")!= undefined?this.form()?.getValue("activity.id"):null;
    });
  }

  formValueAsLocalDateTime(name:string){
    let value =this.formValue(name) as string|undefined;
    if(!value){
      return null;
    }
    let date = new Date(value);
    return date.toISOString().substring(0,11)+date.toLocaleTimeString().substring(0,5);
  }

  protected override loadDocument(): Promise<SingleResourceDoc | undefined> {
    let projectId = this.route.snapshot.params['project-id'];
    return this.jsonApiService.GetProjectSlot(projectId, this.route.snapshot.params['id'])
  }
}

