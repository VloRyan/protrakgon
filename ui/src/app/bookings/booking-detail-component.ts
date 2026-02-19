import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { JsonApiService } from '../json-api.service';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { MatSelect } from '@angular/material/select';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  ObjectLike,
  ResourceObject,
  SingleResourceDoc,
} from '@vloryan/ts-jsonapi-form/jsonapi/model';
import { DocumentFormComponent } from '../document-form/document-form-component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-booking-detail-component',
  imports: [
    MatCard,
    MatCardContent,
    MatFormField,
    MatLabel,
    MatInput,
    FaIconComponent,
    MatProgressSpinner,
    FormsModule,
  ],
  template: `
    <mat-card appearance="outlined">
      <mat-card-content>
        @if (activitiesLoaded()) {
          <form id="item-form" (submit)="onSubmit($event)">
            <mat-form-field
              floatLabel="always"
              [style.width.%]="49"
              [style.padding-right.%]="1"
            >
              <mat-label>Activity</mat-label>
              <select
                matNativeControl
                name="activity.id"
                #activitySelect
                (input)="onActivityChanged($event)"
              >
                @for (activity of this.activities; track $index) {
                  @if (formValue('activity.id') == activity.id) {
                    <option [value]="activity.id" selected>
                      <fa-icon
                        [icon]="['fas', activity.attributes!['icon']! + '']"
                        [style.padding-right.px]="2"
                      />
                      {{ activity.attributes!['name'] }}
                    </option>
                  } @else {
                    <option [value]="activity.id">
                      <fa-icon
                        [icon]="['fas', activity.attributes!['icon']! + '']"
                        [style.padding-right.px]="2"
                      />
                      {{ activity.attributes!['name'] }}
                    </option>
                  }
                }
              </select>
            </mat-form-field>
            <mat-form-field
              floatLabel="always"
              [style.width.%]="19"
              [style.padding-right.%]="1"
            >
              <mat-label> Date </mat-label>
              <input
                #dateField
                matInput
                name="date"
                type="date"
                min="2026-01-01"
                max="2026-12-31"
                [defaultValue]="
                  this.formValue('start') ? formValueAsDate('start') : today()
                "
                (input)="onInput($event)"
              />
            </mat-form-field>

            @if (this.billableAmountUnit() != 2) {
              <mat-form-field floatLabel="always" [style.width.%]="15">
                <mat-label> Start </mat-label>
                <input
                  matInput
                  name="start"
                  type="time"
                  [defaultValue]="
                    this.formValue('start')
                      ? formValueAsTime('start')
                      : nowAsTime()
                  "
                  (input)="setRelativeTime($event, dateField.value)"
                />
              </mat-form-field>
              <mat-form-field floatLabel="always" [style.width.%]="15">
                <mat-label>End</mat-label>
                <input
                  matInput
                  name="end"
                  type="time"
                  [defaultValue]="formValueAsTime('end')"
                  (input)="setRelativeTime($event, dateField.value)"
                />
              </mat-form-field>
            }
            <br />
            <mat-form-field floatLabel="always" [style.width.%]="100">
              <mat-label>Description</mat-label>
              <textarea
                matNativeControl
                name="description"
                rows="2"
                [defaultValue]="formValue('description')"
                (input)="onInput($event)"
              ></textarea>
            </mat-form-field>
          </form>
        } @else {
          <mat-spinner />
        }
      </mat-card-content>
    </mat-card>
  `,
  styleUrl: './booking-detail-component.scss',
})
export class BookingDetailComponent extends DocumentFormComponent {
  activitySelect = new MatSelect();
  activitiesLoaded = signal<boolean>(false);
  activities: ResourceObject[] = [];
  billableAmountUnit = signal<number>(0);
  route: ActivatedRoute = inject(ActivatedRoute);
  jsonApiService: JsonApiService = inject(JsonApiService);

  constructor() {
    super('Booking', '', '');
    const projectId = this.route.snapshot.params['project-id'];
    this.baseUrl = 'project/' + projectId + '/booking';
    this.baseApiUrl = 'project/' + projectId + '/booking';
  }

  override ngOnInit() {
    super.ngOnInit();
    const projectId = this.route.snapshot.params['project-id'];
    this.jsonApiService.GetProjectActivities(projectId).then((doc) => {
      const theDoc = doc ? doc : null;
      this.activities = theDoc?.data ?? [];
      this.activitiesLoaded.set(true);
      let selectedActivityId =
        this.form()?.getValue('activity') != null
          ? (this.form()?.getValue('activity.id') as string)
          : this.activities.length != 0
            ? this.activities[0]!.id
            : undefined;
      let selectedActivity = this.findActivity(selectedActivityId);
      this.activitySelect.value =
        selectedActivity != undefined ? selectedActivity.id : null;
      this.billableAmountUnit.set(
        selectedActivity != undefined
          ? (selectedActivity.attributes!['billableAmountUnit'] as number)
          : 0,
      );

      // set default value
      if (this.form()?.getValue('activity') == null) {
        let newForm = this.form()!;
        newForm.setValue('activity', selectedActivity as unknown as ObjectLike);
        this.form.set(newForm);
      }
    });
  }

  setRelativeTime(ev: Event, atDate: string) {
    let element = ev.target as HTMLInputElement;
    let dateStr = atDate + 'T' + element.value + ':00';
    let date = new Date(dateStr);
    let field = element.name;
    this.form()?.setValue(field, date.toISOString().slice(0, 19) + 'Z');
    this.form()?.setValue('amount', -1);
  }

  formValueAsLocalDateTime(name: string) {
    const value = this.formValue(name) as string | undefined;
    if (!value) {
      return null;
    }
    const date = new Date(value);
    return (
      date.toISOString().substring(0, 11) +
      date.toLocaleTimeString().substring(0, 5)
    );
  }

  today() {
    return new Date().toISOString().substring(0, 10);
  }
  nowAsTime() {
    return new Date().toLocaleTimeString().substring(0, 5);
  }

  formValueAsTime(name: string) {
    const value = this.formValue(name) as string | undefined;
    if (!value) {
      return null;
    }
    const date = new Date(value);
    return date.toLocaleTimeString().substring(0, 5);
  }

  formValueAsDate(name: string) {
    const value = this.formValue(name) as string | undefined;
    if (!value) {
      return null;
    }
    const date = new Date(value);
    return date.toISOString().substring(0, 10);
  }

  onActivityChanged(ev: Event) {
    this.onInput(ev);
    let activity = this.findActivity((ev.target as HTMLSelectElement).value);
    this.billableAmountUnit.set(
      activity != undefined
        ? (activity.attributes!['billableAmountUnit'] as number)
        : 0,
    );
  }

  findActivity(id: string | undefined): ResourceObject | undefined {
    if (id == undefined) {
      return undefined;
    }
    for (let act of this.activities) {
      if (act.id == id) {
        return act;
      }
    }
    return undefined;
  }

  protected override loadDocument(): Promise<SingleResourceDoc | undefined> {
    const projectId = this.route.snapshot.params['project-id'];
    return this.jsonApiService.GetProjectBooking(
      projectId,
      this.route.snapshot.params['id'],
    );
  }
}
