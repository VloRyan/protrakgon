import {Component, inject, input, OnInit, output, signal} from '@angular/core';
import {JsonApiService} from '../json-api.service';
import {ObjectLike, ResourceObject} from '../../../../../../ts/ts-jsonapi-form/jsonapi/model';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {MatButton} from '@angular/material/button';
import {Router} from '@angular/router';
import {EmptyFetchOpts, FetchOpts} from '../../../../../../ts/ts-jsonapi-form/jsonapi';
import {FormsModule} from '@angular/forms';
import {MatFormField} from '@angular/material/form-field';
import {MatInput, MatLabel} from '@angular/material/input';
import {SingleObjectForm} from '../../../../../../ts/ts-jsonapi-form/form';
import {toFilterObject} from '../../../../../../ts/ts-jsonapi-form/functions';

export enum Comparator {
  Eq = 0,
  NeEq,
  Lt,
  LtEq,
  Gt,
  GtEq,
}


@Component({
  selector: 'app-slots-filter-component',
  imports: [
    FaIconComponent,
    MatButton,
    FormsModule,
    MatFormField,
    MatInput,
    MatLabel,
  ],
  template: `
    <form id="item-form" (submit)="onSubmit($event)">
      <mat-form-field floatLabel="always" [style.width.%]=100>
        <mat-label>Activity</mat-label>
        <select matNativeControl name="activityId" (input)="onInput($event)">
          <option value=""></option>
          @for (activity of this.activities(); track $index) {
              <option [value]="activity.id" [selected]="this.searchForm()?.getValue('activityId') == activity.id">
                <fa-icon [icon]="['fas', (activity.attributes!['icon']! +'')]" [style.padding-right.px]="2"/>
                {{ activity.attributes!['name'] }}
              </option>
          }
        </select>
      </mat-form-field>
      <br/>
      <mat-form-field floatLabel="always" [style.width.%]=20>
        <mat-label></mat-label>
        <select matNativeControl name="fromComparator" (input)="this.onInput($event)">
          @for (comp of this.Comparators; track $index) {
            <option [value]="comp" [selected]="this.searchForm()?.getValue('fromComparator') == comp">
              {{this.ComparatorCaptions[$index]}}
            </option>
          }
        </select>
      </mat-form-field>
      <mat-form-field floatLabel="always" [style.width.%]=80>
        <mat-label>Start</mat-label>
        <input matInput name="from" type="date" [defaultValue]="this.asDateString(searchForm()?.getValue('from'))"
               (input)="this.onInput($event)">
      </mat-form-field>

      <br/>
      <mat-form-field floatLabel="always" [style.width.%]=20>
        <mat-label></mat-label>
        <select matNativeControl name="untilComparator" (input)="this.onInput($event)">
          @for (comp of this.Comparators; track $index) {
            <option [value]="comp" [selected]="this.searchForm()?.getValue('untilComparator') == comp">
              {{this.ComparatorCaptions[$index]}}
            </option>
          }
        </select>
      </mat-form-field>
      <mat-form-field floatLabel="always" [style.width.%]=80>
        <mat-label>End</mat-label>
        <input matInput name="until" type="date" [defaultValue]="this.asDateString(searchForm()?.getValue('until'))"
               (input)="this.onInput($event)">
      </mat-form-field>
      <br/>
      <mat-form-field floatLabel="always" [style.width.%]=49>
        <mat-label>Billable</mat-label>
        <select matNativeControl name="billable" (input)="this.onInput($event)">
          <option value=""></option>
          <option value="true" [selected]="searchForm()?.getValue('billable')===true">Yes</option>
          <option value="false" [selected]="searchForm()?.getValue('billable')===false">No</option>
        </select>
      </mat-form-field>
      <mat-form-field floatLabel="always" [style.width.%]=49>
        <mat-label>State</mat-label>
        <select matNativeControl name="isOpen" (input)="this.onInput($event)">
          <option value=""></option>
          <option value="true" [selected]="searchForm()?.getValue('isOpen')===true">Is open</option>
          <option value="false" [selected]="searchForm()?.getValue('isOpen')===false">Is closed</option>
        </select>
      </mat-form-field>
      <br/>
      <mat-form-field floatLabel="always" [style.width.%]=100>
        <mat-label>Description</mat-label>
        <input matInput name="description" (input)="this.onInput($event)">
      </mat-form-field>
      <button matButton type="submit">
        <fa-icon [icon]="['fas', 'search']"/>
      </button>
    </form>
  `,
})
export class SlotsFilterComponent implements OnInit {
  projectId = input.required<string>();
  jsonApiService: JsonApiService = inject(JsonApiService);
  queryFilterPrefix = input<string>("");
  fetchOpts = input<FetchOpts>(EmptyFetchOpts);
  activities = signal<ResourceObject[]>([]);
  searchForm = signal<SingleObjectForm<ObjectLike> | null>(null);
  router: Router = inject(Router);
  filterChanged = output<ObjectLike>();
  readonly Comparators = [/*Comparator.Eq*/'', Comparator.NeEq, Comparator.Lt, Comparator.LtEq, Comparator.Gt, Comparator.GtEq,];
   readonly ComparatorCaptions = ['=', '!=', '<', '<=', '>', '>='];



  ngOnInit(): void {
    this.searchForm.set(new SingleObjectForm({object: this.fetchOpts().filter ? this.fetchOpts().filter! : {}}))

    this.jsonApiService.GetProjectActivities(this.projectId()).then((doc) => {
      let theDoc = doc ? doc : null;
      this.activities.set(theDoc?.data ?? []);
    });
  }

  asDateString(value: any): string | undefined {
    if (value === undefined || value.length < 10) {
      return undefined;
    }
    return value.substring(0, 10);
  }

  onInput(ev: Event) {
    const target = ev.target as HTMLInputElement;
    if (target && (target.type === 'select-one' || target.type === 'text' ) && target.value === '') {
      this.searchForm()?.removeValue(target!.name);
    } else {
      this.searchForm()?.handleChangeEvent(ev);
    }
  }

  onSubmit(_ev: Event) {
    let filter = toFilterObject(this.searchForm()!.object as ObjectLike, this.queryFilterPrefix())
    this.router.navigate([], {queryParams: filter}).then(() => {
      this.filterChanged.emit(this.searchForm()!.object as ObjectLike)
    })
  }
}

