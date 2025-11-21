import {Component, inject, input, OnInit, signal} from '@angular/core';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {MatMiniFabButton} from '@angular/material/button';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {JsonApiService} from '../json-api.service';
import {ResourceIdentifierObject, ResourceObject, SingleResourceDoc} from '@vloryan/ts-jsonapi-form/jsonapi/model';
import {DocumentForm} from '@vloryan/ts-jsonapi-form/form';
import {EmptyFetchOpts, findInclude} from '@vloryan/ts-jsonapi-form/jsonapi';
import {joinPath} from '@vloryan/ts-jsonapi-form/functions';
import {AppConfigService} from '../app-config.service';

interface SlotType {
  id: string;
  activityName: string;
  activityIcon: string;
}

@Component({
  selector: 'app-track-slot-button',
  imports: [
    MatMenuTrigger,
    MatMenu,
    FaIconComponent,
    MatMiniFabButton,
    MatProgressSpinner,
    MatMenuItem
  ],
  template: `
    <div>
      @if (openSlot() != undefined) {
        <button matMiniFab (click)="this.endSlot($event,openSlot()!)"
                [title]="'Stop tracking '+openSlot()?.activityName+' time'" style="width: 50px;">
          <fa-icon [icon]="['fas', 'pause']"/>
          <fa-icon [icon]="['fas', openSlot()!.activityIcon+'']"/>
          <fa-icon [icon]="['fas', 'circle']" animation="beat-fade" class="danger"/>
        </button>
      } @else {
        <button matMiniFab [matMenuTriggerFor]="menu" (click)="this.openMenu($event)" title="Start tracking time">
          <fa-icon [icon]="['fas', 'play']"/>
          <fa-icon [icon]="['fas', 'angle-down']"/>
        </button>
        <mat-menu #menu="matMenu">
          @if (activitiesObjects() == undefined) {
            @if (this.isLoading()) {
              <mat-spinner></mat-spinner>
            } @else {

            }
          } @else {
            @for (activity of activitiesObjects(); track $index) {
              <button mat-menu-item (click)="this.startSlot(activity.id)">
                <fa-icon [icon]="['fas', (activity.attributes!['icon']! +'')]" [style.padding-right.px]="2"/>
                {{ activity.attributes!['name'] }}
              </button>
            }
          }

        </mat-menu>
      }
    </div>
  `,
  styleUrls: ['./track-slot-button.scss'],
})
export class TrackSlotButton implements OnInit {
  isLoading = signal(true);
  jsonApiService: JsonApiService = inject(JsonApiService);
  openSlot = signal<SlotType | undefined>(undefined);
  activitiesObjects = signal<ResourceObject[] | undefined>(undefined);
  projectId = input.required<string>();
appConfig = inject(AppConfigService);
  protected readonly open = open;

  ngOnInit(): void {
    this.updateOpenSlot();
  }

  updateOpenSlot() {
    this.jsonApiService.GetProjectSlots(this.projectId(), {
      ...EmptyFetchOpts,
      filter: {isOpen: true},
      includes: ['activity']
    }).then((doc) => {
      if (doc?.data == undefined || doc?.data.length == 0) {
        this.openSlot.set(undefined);
      } else {
        const firstSlot = doc!.data[0]!;
        const activity = findInclude(firstSlot.relationships!['activity']!.data as ResourceIdentifierObject, doc.included ?? [])
        this.openSlot.set({
          id: firstSlot.id,
          activityName: activity!.attributes!['name'] as string,
          activityIcon: activity!.attributes!['icon'] as string,
        }satisfies SlotType);
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

  startSlot(activityId: string) {
    const form = new DocumentForm({
      document: {
        data: {
          id: "",
          lid: "",
          type: "project.slot",
          relationships: {
            activity: {data: {id: activityId, type: "project.activity", lid: undefined}},
            project: {data: {id: this.projectId(), type: "project", lid: undefined}},
          },
          links: {
            self: joinPath(this.appConfig.apiUrl(),`project/${this.projectId()}/slot`),
          }
        },
        included: undefined,
        jsonapi: undefined,
        links: undefined,
        meta: undefined,
        errors: undefined
      } as SingleResourceDoc
    });
    form.submit().then(()=>this.updateOpenSlot());
  }

  endSlot(ev: MouseEvent, slot: SlotType) {
    ev.stopPropagation();
    ev.preventDefault();
    const form = new DocumentForm({
      document: {
        data: {
          id: slot.id,
          lid: "",
          type: "project.slot",
          attributes: {
            end: new Date().toISOString(),
          },
          links: {
            self: joinPath(this.appConfig.apiUrl(),`project/${this.projectId()}/slot`, slot.id)
          }
        },
        included: undefined,
        jsonapi: undefined,
        links: undefined,
        meta: undefined,
        errors: undefined
      } as SingleResourceDoc
    });
    form.submit().then(()=>this.updateOpenSlot());
  }
}
