import {Component, inject, OnInit, signal} from '@angular/core';
import {MatCard, MatCardContent} from '@angular/material/card';
import {ActivatedRoute, Router} from '@angular/router';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {JsonApiService} from '../json-api.service';
import {DocumentForm, DocumentFormProps} from '../../../../../../ts/ts-jsonapi-form/form';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from '@angular/material/autocomplete';
import {ObjectLike, ResourceObject} from '../../../../../../ts/ts-jsonapi-form/jsonapi/model';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {AppService} from '../app.service';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {finalize} from 'rxjs';
import {ActivitiesCardComponent} from '../activities/activities-card-component';
import {SlotsCardComponent} from '../slots/slots-card-component';
import {EmptyFetchOpts, extractFetchOpts, FetchOpts} from '../../../../../../ts/ts-jsonapi-form/jsonapi/';

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
    SlotsCardComponent
  ],
  template: `
    <mat-card appearance="outlined">
      <mat-card-content>
        <form #projectForm id="item-form" (submit)="onSubmit($event)">
          <mat-form-field [style.width.%]=49 [style.padding-right.%]="1">
            <mat-label>Name</mat-label>
            <input matInput name="name" [defaultValue]="form() != null ? form()?.getValue('name'):''"
                   (input)="onInput($event)">
          </mat-form-field>
          <mat-form-field [style.width.%]=49 [style.padding-left.%]="1">
            <mat-label>Client</mat-label>
            <input matInput placeholder="Choose a client" (keyup)="updateOptions($event)" [matAutocomplete]="auto"
                   [formControl]="searchInput" name="client">
          </mat-form-field>
          <br/>
          <mat-form-field [style.width.%]=100>
            <mat-label>Description</mat-label>
            <input matInput name="description"
                   [defaultValue]="form() != null &&  form()?.getValue('description')? form()?.getValue('description'):''"
                   (input)="onInput($event)">
          </mat-form-field>

          <mat-autocomplete #auto="matAutocomplete" requireSelection [displayWith]="displayFn">
            @if (isLoading()) {
              <mat-option class="is-loading">
                <mat-spinner diameter="50"></mat-spinner>
              </mat-option>
            }

            @for (object of filteredObjects; track object.id) {
              <mat-option [value]="object">
                <span>{{ object.attributes!["name"] }}</span>
                <small> | ID: {{ object.id }}</small>
              </mat-option>
            }
          </mat-autocomplete>
        </form>
      </mat-card-content>
    </mat-card>
    @if (form() != null) {
      <br/>
      <app-activities-card-component [projectId]="projectId()"></app-activities-card-component>
      <br/>
      <app-slots-card-component [projectId]="projectId()" [fetchOpts]="fetchOptsWithFilter(this.slotsFilter())"
                                queryFilterPrefix="slots"></app-slots-card-component>
    }
  `,
  styleUrl: './project-detail.scss',
})
export class ProjectDetail implements OnInit {
  route: ActivatedRoute = inject(ActivatedRoute);
  form = signal<DocumentForm | null>(null);
  jsonApiService: JsonApiService = inject(JsonApiService);
  appService: AppService = inject(AppService);
  router: Router = inject(Router);
  filteredObjects: ResourceObject[] = [];
  isLoading = signal<boolean>(false);
  filter: ObjectLike = {};
  fetchOpts = EmptyFetchOpts;
  protected searchInput: FormControl = new FormControl();
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.jsonApiService.GetProject(this.route.snapshot.params['id']).then((doc) => {
      let theDoc = doc ? doc : null;
      let props = {
        document: theDoc,
        apiUrl: "api/v1/project" + (theDoc?.data.id ? "/" + theDoc!.data.id : ""),
        onSubmitSuccess: (object) => {
          this.snackBar.open('Project created successfully.', '', {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
            duration: 3000,
          });
          this.router.navigate(["/project/", object.id]).then(
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
      this.searchInput.setValue(form.getValue("client"));
      this.form.set(form);
    });

    this.searchInput.valueChanges.subscribe(value => {
      if (!this.form()) {
        return;
      }
      value ? this.form()!.setValue("client", value) : this.form()!.removeValue("client")
    });
  }

  ngOnInit(): void {
    let queryString = "";
    for (const k in this.route.snapshot.queryParams) {
      if (queryString.length > 0) {
        queryString += "&";
      }
      queryString += k + "=" + this.route.snapshot.queryParams[k];
    }
    this.fetchOpts = extractFetchOpts(queryString);
  }

  fetchOptsWithFilter(filter: ObjectLike): FetchOpts {
    return {...EmptyFetchOpts, filter: filter};
  }

  slotsFilter(): ObjectLike {
    return this.fetchOpts.filter != undefined && this.fetchOpts.filter["slots"] != undefined ? this.fetchOpts.filter["slots"] as ObjectLike : {}
  }

  projectId() {
    let form = this.form();
    if (form) {
      return form.getValue("id") as string;
    }
    return "";
  }

  updateOptions(ev: Event) {
    let input = ev.currentTarget as HTMLInputElement;
    this.isLoading.set(true);
    this.appService.search({name: input.value}).pipe(
      finalize(() => this.isLoading.set(false)),
    ).subscribe(doc => this.filteredObjects = doc?.data ?? [])
  }

  displayFn(object: any) {
    if (object && object.attributes) {
      return object.attributes!["name"] ?? "";
    }
    return ""
  }

  onInput(ev: Event) {
    this.form()?.handleChangeEvent(ev);
  }

  onSubmit(ev: Event) {
    this.form()?.handleSubmit(ev);
  }
}
