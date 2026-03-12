import { Component, inject } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { JsonApiService } from '../json-api.service';
import {
  MatAutocomplete,
  MatAutocompleteTrigger,
  MatOption,
} from '@angular/material/autocomplete';
import {
  ObjectLike,
  ResourceObject,
  SingleResourceDoc,
} from '@vloryan/ts-jsonapi-form/jsonapi/model';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { ActivitiesCardComponent } from '../activities/activities-card-component';
import { BookingsCardComponent } from '../bookings/bookings-card-component';
import {
  EmptyFetchOpts,
  extractFetchOpts,
  FetchOpts,
} from '@vloryan/ts-jsonapi-form/jsonapi/';
import { DocumentFormComponent } from '../document-form/document-form-component';
import { format } from 'date-fns';

@Component({
  selector: 'app-project-detail',
  imports: [
    MatCard,
    MatCardContent,
    MatFormFieldModule,
    MatInputModule,
    MatAutocomplete,
    MatOption,
    ReactiveFormsModule,
    MatAutocompleteTrigger,
    MatProgressSpinner,
    ActivitiesCardComponent,
    BookingsCardComponent,
  ],
  template: `
    <mat-card appearance="outlined">
      <mat-card-content>
        <form #projectForm id="item-form" (submit)="onSubmit($event)">
          <mat-form-field [style.width.%]="49" [style.padding-right.%]="1">
            <mat-label>Name</mat-label>
            <input
              matInput
              name="name"
              [defaultValue]="formValue('name')"
              (input)="onInput($event)"
            />
          </mat-form-field>
          <mat-form-field [style.width.%]="49" [style.padding-left.%]="1">
            <mat-label>Client</mat-label>
            <input
              matInput
              placeholder="Choose a client"
              (keyup)="updateOptions($event)"
              [matAutocomplete]="auto"
              [formControl]="clientSearchInput"
              name="client"
            />
          </mat-form-field>
          <br />
          <mat-form-field [style.width.%]="100">
            <mat-label>Description</mat-label>
            <input
              matInput
              name="description"
              [defaultValue]="formValue('description')"
              (input)="onInput($event)"
            />
          </mat-form-field>

          <mat-autocomplete
            #auto="matAutocomplete"
            requireSelection
            [displayWith]="displayFn"
          >
            @if (isLoading()) {
              <mat-option class="is-loading">
                <mat-spinner diameter="50"></mat-spinner>
              </mat-option>
            }

            @for (object of filteredObjects; track object.id) {
              <mat-option [value]="object">
                <span>{{ object.attributes!['name'] }}</span>
                <small> | ID: {{ object.id }}</small>
              </mat-option>
            }
          </mat-autocomplete>
        </form>
      </mat-card-content>
    </mat-card>
    @if (form() != null) {
      <br />
      <app-activities-card-component [projectId]="projectId()" />
      <br />
      <app-bookings-card-component
        [projectId]="projectId()"
        [fetchOpts]="
          fetchOptsWithFilterAndSort(this.bookingsFilter(), '-start')
        "
        queryFilterPrefix="bookings"
      ></app-bookings-card-component>
    }
  `,
  styleUrl: './project-detail.scss',
})
export class ProjectDetail extends DocumentFormComponent {
  jsonApiService: JsonApiService = inject(JsonApiService);
  filteredObjects: ResourceObject[] = [];
  filter: ObjectLike = {};
  fetchOpts = EmptyFetchOpts;
  route: ActivatedRoute = inject(ActivatedRoute);
  protected clientSearchInput: FormControl = new FormControl();

  constructor() {
    super('Project', 'project', 'project');
  }

  override afterLoadForm() {
    this.clientSearchInput.setValue(this.formValue('client'));
    this.clientSearchInput.valueChanges.subscribe((value) => {
      if (!this.form()) {
        return;
      }
      if (value) {
        this.form()!.setValue('client', value);
      } else {
        this.form()!.removeValue('client');
      }
    });
  }

  override ngOnInit(): void {
    super.ngOnInit();
    let queryString = '';
    for (const k in this.route.snapshot.queryParams) {
      if (queryString.length > 0) {
        queryString += '&';
      }
      queryString += k + '=' + this.route.snapshot.queryParams[k];
    }
    this.fetchOpts = extractFetchOpts(queryString);
  }

  fetchOptsWithFilterAndSort(filter: ObjectLike, sort: string): FetchOpts {
    return {
      ...EmptyFetchOpts,
      page: { offset: 0, limit: -1 },
      filter: filter,
      sort: sort,
    };
  }

  bookingsFilter(): ObjectLike {
    let now = new Date();
    let firstDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    let lastDay = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0));
    return this.fetchOpts.filter != undefined &&
      this.fetchOpts.filter['bookings'] != undefined
      ? (this.fetchOpts.filter['bookings'] as ObjectLike)
      : {
          from: format(firstDay, 'yyyy-MM-dd'),
          fromComparator: 5, // >=
          until: format(lastDay, 'yyyy-MM-dd'),
          untilComparator: 3, // <=
        };
  }

  projectId() {
    const form = this.form();
    if (form) {
      return form.getValue('id') as string;
    }
    return '';
  }

  updateOptions(ev: Event) {
    const input = ev.currentTarget as HTMLInputElement;
    this.isLoading.set(true);
    this.jsonApiService
      .SearchForClient({ name: input.value })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe((doc) => (this.filteredObjects = doc?.data ?? []));
  }

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  displayFn(object: any) {
    if (object && object.attributes) {
      return object.attributes!['name'] ?? '';
    }
    return '';
  }

  protected override loadDocument(): Promise<SingleResourceDoc | undefined> {
    return this.jsonApiService.GetProject(this.route.snapshot.params['id']);
  }
}
