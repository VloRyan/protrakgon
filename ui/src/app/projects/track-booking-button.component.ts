import { Component, inject, input, OnInit, signal } from '@angular/core';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MatMiniFabButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { JsonApiService } from '../json-api.service';
import {
  ResourceIdentifierObject,
  ResourceObject,
  SingleResourceDoc,
} from '@vloryan/ts-jsonapi-form/jsonapi/model';
import { DocumentForm } from '@vloryan/ts-jsonapi-form/form';
import { EmptyFetchOpts, findInclude } from '@vloryan/ts-jsonapi-form/jsonapi';
import { joinPath } from '@vloryan/ts-jsonapi-form/functions';
import { AppConfigService } from '../app-config.service';

interface BookingType {
  id: string;
  activityName: string;
  activityIcon: string;
}

@Component({
  selector: 'app-track-booking-button',
  imports: [
    MatMenuTrigger,
    MatMenu,
    FaIconComponent,
    MatMiniFabButton,
    MatProgressSpinner,
    MatMenuItem,
  ],
  template: `
    <div>
      @if (openBooking() != undefined) {
        <button
          matMiniFab
          (click)="this.endBooking($event, openBooking()!)"
          [title]="'Stop tracking ' + openBooking()?.activityName + ' time'"
          style="width: 50px;"
        >
          <fa-icon [icon]="['fas', 'pause']" />
          <fa-icon [icon]="['fas', openBooking()!.activityIcon + '']" />
          <fa-icon
            [icon]="['fas', 'circle']"
            animation="beat-fade"
            class="danger"
          />
        </button>
      } @else {
        <button
          matMiniFab
          [matMenuTriggerFor]="menu"
          (click)="this.openMenu($event)"
          title="Start tracking time"
        >
          <fa-icon [icon]="['fas', 'play']" />
          <fa-icon [icon]="['fas', 'angle-down']" />
        </button>
        <mat-menu #menu="matMenu">
          @if (activitiesObjects() == undefined) {
            @if (this.isLoading()) {
              <mat-spinner></mat-spinner>
            } @else {}
          } @else {
            @for (activity of activitiesObjects(); track $index) {
              <button mat-menu-item (click)="this.startBooking(activity.id)">
                <fa-icon
                  [icon]="['fas', activity.attributes!['icon']! + '']"
                  [style.padding-right.px]="2"
                />
                {{ activity.attributes!['name'] }}
              </button>
            }
          }
        </mat-menu>
      }
    </div>
  `,
  styleUrls: ['./track-booking-button.component.scss'],
})
export class TrackBookingButton implements OnInit {
  isLoading = signal(true);
  jsonApiService: JsonApiService = inject(JsonApiService);
  openBooking = signal<BookingType | undefined>(undefined);
  activitiesObjects = signal<ResourceObject[] | undefined>(undefined);
  projectId = input.required<string>();
  appConfig = inject(AppConfigService);
  protected readonly open = open;

  ngOnInit(): void {
    this.updateOpenBooking();
  }

  updateOpenBooking() {
    this.jsonApiService
      .GetProjectBookings(this.projectId(), {
        ...EmptyFetchOpts,
        filter: { isOpen: true },
        includes: ['activity'],
      })
      .then((doc) => {
        if (doc?.data == undefined || doc?.data.length == 0) {
          this.openBooking.set(undefined);
        } else {
          const firstBooking = doc!.data[0]!;
          const activity = findInclude(
            firstBooking.relationships!['activity']!
              .data as ResourceIdentifierObject,
            doc.included ?? [],
          );
          this.openBooking.set({
            id: firstBooking.id,
            activityName: activity!.attributes!['name'] as string,
            activityIcon: activity!.attributes!['icon'] as string,
          } satisfies BookingType);
        }
      });
  }

  openMenu(ev: MouseEvent) {
    ev.stopPropagation();
    ev.preventDefault();
    this.isLoading.set(true);
    this.jsonApiService.GetProjectActivities(this.projectId()).then((doc) => {
      this.activitiesObjects.set(doc?.data);
      this.isLoading.set(false);
    });
  }

  startBooking(activityId: string) {
    const form = new DocumentForm({
      document: {
        data: {
          id: '',
          lid: '',
          type: 'project.booking',
          relationships: {
            activity: {
              data: {
                id: activityId,
                type: 'project.activity',
                lid: undefined,
              },
            },
            project: {
              data: { id: this.projectId(), type: 'project', lid: undefined },
            },
          },
          links: {
            self: joinPath(
              this.appConfig.apiUrl(),
              `project/${this.projectId()}/booking`,
            ),
          },
        },
        included: undefined,
        jsonapi: undefined,
        links: undefined,
        meta: undefined,
        errors: undefined,
      } as SingleResourceDoc,
    });
    form.submit().then(() => this.updateOpenBooking());
  }

  endBooking(ev: MouseEvent, booking: BookingType) {
    ev.stopPropagation();
    ev.preventDefault();
    const form = new DocumentForm({
      document: {
        data: {
          id: booking.id,
          lid: '',
          type: 'project.booking',
          attributes: {
            end: new Date().toISOString(),
          },
          links: {
            self: joinPath(
              this.appConfig.apiUrl(),
              `project/${this.projectId()}/booking`,
              booking.id,
            ),
          },
        },
        included: undefined,
        jsonapi: undefined,
        links: undefined,
        meta: undefined,
        errors: undefined,
      } as SingleResourceDoc,
    });
    form.submit().then(() => this.updateOpenBooking());
  }
}
