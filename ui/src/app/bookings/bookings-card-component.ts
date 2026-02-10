import { Component, inject, input, signal } from '@angular/core';
import {
  MatCard,
  MatCardContent,
  MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { JsonApiService } from '../json-api.service';
import {
  CollectionResourceDoc,
  Document,
  ObjectLike,
  PrimaryData,
  ResourceIdentifierObject,
  ResourceObject,
} from '@vloryan/ts-jsonapi-form/jsonapi/model';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
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
  MatTable,
} from '@angular/material/table';
import { MatButton, MatMiniFabButton } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {
  buildQueryString,
  EmptyFetchOpts,
  FetchOpts,
  findInclude,
} from '@vloryan/ts-jsonapi-form/jsonapi';
import { formatDateString, joinPath } from '@vloryan/ts-jsonapi-form/functions';
import { FormsModule } from '@angular/forms';

import { MatSidenav, MatSidenavContainer } from '@angular/material/sidenav';
import { BookingsFilterComponent } from './bookings-filter-component';
import {
  DocumentTableComponent,
  Group,
} from '../document-form/document-table-component';
import { AppConfigService } from '../app-config.service';

export enum Comparator {
  Eq = 0,
  NeEq,
  Lt,
  LtEq,
  Gt,
  GtEq,
}

export interface ActivitySummary {
  id: string;
  name: string;
  icon: string;
  amountSum: number;
  amountUnit: number;
}

@Component({
  selector: 'app-bookings-card-component',
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
    FormsModule,

    MatSidenav,
    MatSidenavContainer,
    BookingsFilterComponent,
  ],
  template: `
    <mat-sidenav-container [style.min-height.px]="500">
      <mat-sidenav #filterBar position="end" mode="push">
        <app-bookings-filter-component
          [projectId]="this.projectId()"
          [fetchOpts]="this.fetchOpts()"
          [queryFilterPrefix]="this.queryFilterPrefix()"
          (filterChanged)="onFilterChanged($event, filterBar)"
        ></app-bookings-filter-component>
      </mat-sidenav>
      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>Bookings</mat-card-title>
          <span class="toolbar-spacer"></span>
          <a
            matButton="outlined"
            title="Download .csv file"
            [href]="this.csvDownloadLink()"
            [download]="'bookings_' + this.projectId() + '.csv'"
          >
            <fa-icon [icon]="['fas', 'file-download']" />
          </a>
          <button
            [matButton]="wrapText() ? 'outlined' : 'filled'"
            title="Minimize text in columns (disable wrapping)"
            (click)="wrapText.set(!wrapText())"
          >
            <fa-icon [icon]="['fas', 'minimize']" />
          </button>
          <a
            [routerLink]="['/project', this.projectId(), 'booking', 'new']"
            matButton="outlined"
          >
            <fa-icon [icon]="['fas', 'plus']" />
          </a>
          <button
            [matButton]="
              this.isEmpty(this.fetchOpts().filter) ? 'outlined' : 'filled'
            "
            (click)="filterBar.toggle()"
          >
            <fa-icon [icon]="['fas', 'filter']" />
          </button>
        </mat-card-header>
        <mat-card-content>
          @if (isLoading()) {
            <mat-spinner />
          } @else {
            <table
              mat-table
              [dataSource]="rows()"
              class="results-table mat-elevation-z8"
            >
              <ng-container matColumnDef="activity">
                <th mat-header-cell *matHeaderCellDef>Activity</th>
                <td mat-cell *matCellDef="let item">
                  @let activity = findActivity(item);
                  <fa-icon
                    [icon]="['fas', activity?.attributes!['icon'] + '']"
                    [style.padding-right.px]="2"
                  />
                  {{ activity?.attributes!['name'] }}
                </td>
              </ng-container>
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount/Duration</th>
                <td mat-cell *matCellDef="let item">
                  @let activity = findActivity(item);
                  @if (activity?.attributes!['billableAmountUnit']! != 2) {
                    {{ valueAsLocalTime(item.attributes.start) }} -
                    {{ valueAsLocalTime(item.attributes.end) }} ({{
                      this.formatDuration(
                        this.calcDurationInMinutes(
                          item.attributes!['start'],
                          item.attributes?.['end']
                        )
                      )
                    }})
                  } @else {
                    1
                  }
                </td>
              </ng-container>
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td
                  mat-cell
                  *matCellDef="let item"
                  [style.white-space]="wrapText() ? ' pre-wrap' : ''"
                >
                  {{ item.attributes.description }}
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th
                  mat-header-cell
                  *matHeaderCellDef
                  style="text-align: right"
                ></th>
                <td
                  class="action-col"
                  mat-cell
                  *matCellDef="let item"
                  style="text-align: right"
                >
                  <span class="action-spacer"></span>
                  <button matMiniFab (click)="deleteItem($event, item.id)">
                    <fa-icon [icon]="['fas', 'trash']" />
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr
                mat-row
                class="row-hover"
                [routerLink]="[
                  '/project',
                  this.projectId(),
                  'booking',
                  item.id,
                ]"
                *matRowDef="let item; columns: displayedColumns"
              ></tr>

              <!-- Group header -->
              <ng-container matColumnDef="groupHeader">
                <td
                  colspan="999"
                  mat-cell
                  *matCellDef="let group"
                  style="text-align: center;"
                >
                  <strong [style.padding-right.px]="2">{{
                    group.caption
                  }}</strong>
                  @for (summary of group.data; track $index) {
                    <fa-icon
                      [icon]="['fas', summary.icon + '']"
                      [title]="summary.name"
                    />
                    @if (summary.amountUnit != 2) {
                      {{ this.formatDuration(summary.amountSum) }}
                    } @else {
                      {{ summary.amountSum }}
                    }
                  }
                </td>
              </ng-container>

              <tr
                mat-row
                *matRowDef="let _row; columns: ['groupHeader']; when: isGroup"
                style="height: auto;background-color: var(--mat-sys-on-primary)"
              ></tr>
            </table>
          }
        </mat-card-content>
      </mat-card>
    </mat-sidenav-container>
  `,
  styleUrl: './bookings-card-component.scss',
})
export class BookingsCardComponent extends DocumentTableComponent {
  appConfig = inject(AppConfigService);
  displayedColumns: string[] = ['activity', 'amount', 'description', 'actions'];
  projectId = input.required<string>();
  jsonApiService: JsonApiService = inject(JsonApiService);
  fetchOpts = input<FetchOpts>(EmptyFetchOpts);
  queryFilterPrefix = input<string>('');
  doc: CollectionResourceDoc | undefined = undefined;
  wrapText = signal<boolean>(true);
  activities = signal<ResourceObject[]>([]);
  csvDownloadLink = signal('');
  router: Router = inject(Router);

  constructor() {
    super('Booking');
  }

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  isGroup(_index: number, item: any): boolean {
    return item.caption !== undefined;
  }

  override ngOnInit(): void {
    super.ngOnInit();

    this.jsonApiService.GetProjectActivities(this.projectId()).then((doc) => {
      const theDoc = doc ? doc : null;
      this.activities.set(theDoc?.data ?? []);
    });
  }

  override asRows(doc: CollectionResourceDoc | undefined) {
    const data: ResourceObject[] = doc ? doc.data : [];
    if (data.length == 0) {
      this.isLoading.set(false);
      return [];
    }

    data.sort((a, b) => {
      const aStart = a.attributes!['start']! as string;
      const bStart = b.attributes!['start']! as string;
      return aStart > bStart ? -1 : 1;
    });

    let currentGroup = {
      caption: new Date(
        data[0]!.attributes!['start']! as string,
      ).toLocaleDateString(),
      data: [] as ActivitySummary[],
    } satisfies Group;

    const rows: (Group | ResourceObject)[] = [currentGroup];
    for (const item of data) {
      const startDate = new Date(
        item!.attributes!['start']! as string,
      ).toLocaleDateString();

      const activityId = item.relationships!['activity']!
        .data as ResourceIdentifierObject;
      const activity = findInclude(activityId, doc!.included ?? []);

      const amountSum =
        activity?.attributes!['billableAmountUnit'] != 2
          ? this.calcDurationInMinutes(
              item.attributes!['start'] as string,
              item.attributes!['end'] as string | undefined,
            )
          : 1;

      if (startDate !== currentGroup.caption) {
        currentGroup = {
          caption: startDate,
          data: [
            {
              id: activity?.id as string,
              name: activity?.attributes!['name'] as string,
              icon: activity?.attributes!['icon'] as string,
              amountSum: amountSum,
            },
          ] as ActivitySummary[],
        } satisfies Group;
        rows.push(currentGroup);
      } else {
        let found = false;
        for (const summary of currentGroup.data) {
          if (summary.id == activity?.id) {
            summary.amountSum += amountSum;
            found = true;
          }
        }
        if (!found) {
          currentGroup.data.push({
            id: activity?.id as string,
            name: activity?.attributes!['name'] as string,
            icon: activity?.attributes!['icon'] as string,
            amountSum: amountSum,
            amountUnit: activity?.attributes!['billableAmountUnit'] as number,
          } satisfies ActivitySummary);
        }
      }
      rows.push(item);
    }
    this.isLoading.set(false);
    return rows;
  }

  isEmpty(filter: ObjectLike | undefined) {
    if (filter === undefined) {
      return true;
    }
    return Object.keys(filter).length === 0;
  }

  valueAsLocalTime(value: string) {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    return date.toLocaleTimeString().substring(0, 5);
  }

  findActivity(object: ResourceObject) {
    if (this.doc == undefined) {
      return null;
    }
    const id =
      object.relationships && object.relationships!['activity']
        ? object.relationships!['activity'].data
        : undefined;
    if (id == undefined) {
      return null;
    }
    return findInclude(id as ResourceIdentifierObject, this.doc.included ?? []);
  }

  calcDurationInMinutes(start: string, end?: string) {
    let diffMs = end ? new Date(end).getTime() - new Date(start).getTime() : 0;
    return Math.floor(diffMs / 60000);
  }

  formatDuration(durationMinutes: number) {
    const minutes = Math.floor(durationMinutes % 60);
    const hours = Math.floor((durationMinutes % (60 * 24)) / 60);
    const days = Math.floor(durationMinutes / (1000 * 60 * 60 * 24));
    return `
      ${days > 0 ? this.padLeft(days, 2, '\u00A0') + 'd' : ''}
      ${hours > 0 ? this.padLeft(hours, 2, '\u00A0') + 'h' : ''}
      ${minutes > 0 ? this.padLeft(minutes, 2, '\u00A0') + 'm' : ''}
      `.trim();
  }

  padLeft(num: number, size: number, insert: string = ' '): string {
    let s = num + '';
    while (s.length < size) {
      s = insert + s;
    }
    return s;
  }

  formatTimespan(
    start: string | undefined = undefined,
    startComparator: number = Comparator.Eq,
    end: string | undefined = undefined,
    endComparator: number = Comparator.Eq,
    delimiter: string = '...',
  ) {
    let span = '';
    if (start) {
      switch (startComparator ? startComparator : -1) {
        case -1:
        case Comparator.Eq:
        case Comparator.GtEq:
          span = formatDateString(start);
          break;
        case Comparator.Gt:
          span = '>' + formatDateString(start);
          break;
        case Comparator.NeEq:
          span = '!' + formatDateString(start);
          break;
        case Comparator.Lt:
          span = '<' + formatDateString(start);
          break;
        case Comparator.LtEq:
          span = '<=' + formatDateString(start);
          break;
        default:
          return startComparator + ' ' + formatDateString(start);
      }
    }
    if (end) {
      span += (start ? ' ' : '') + delimiter + ' ';
      switch (endComparator ? endComparator : -1) {
        case -1:
        case Comparator.Eq:
        case Comparator.LtEq:
          span += formatDateString(end);
          break;
        case Comparator.Lt:
          span += '<' + formatDateString(end);
          break;
        case Comparator.NeEq:
          span += '!' + formatDateString(end);
          break;
        case Comparator.Gt:
          span += '>' + formatDateString(end);
          break;
        case Comparator.GtEq:
          span += '>=' + formatDateString(end);
          break;
        default:
          return endComparator + ' ' + formatDateString(end);
      }
    }
    return span;
  }

  onFilterChanged(filter: ObjectLike, filterBar: MatSidenav) {
    filterBar.close().then(() => {
      this.fetchOpts().filter = filter;
      this.refreshRows();
    });
  }

  protected override async loadDocument(): Promise<
    CollectionResourceDoc | undefined
  > {
    this.csvDownloadLink.set(
      joinPath(
        this.appConfig.apiUrl(),
        'project/',
        this.projectId(),
        '/booking/csv',
      ) + buildQueryString(this.fetchOpts()),
    );
    return this.jsonApiService
      .GetProjectBookings(this.projectId(), {
        ...this.fetchOpts(),
        includes: ['activity'],
      })
      .then((doc) => {
        this.doc = doc;
        return doc;
      });
  }

  protected override deleteObject(
    id: string,
  ): Promise<Document<PrimaryData> | null> {
    return this.jsonApiService.DeleteBooking(this.projectId(), id);
  }
}
