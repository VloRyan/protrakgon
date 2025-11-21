import {Router, Routes} from '@angular/router';
import {DashboardComponent} from './dashboard/dashboard.component';
import {Client} from './clients/client';
import {ClientDetail} from './clients/client-detail';
import {IconProp} from '@fortawesome/fontawesome-svg-core';
import {ProjectComponent} from './projects/project.component';
import {ProjectDetail} from './projects/project-detail';
import {ActivityDetailComponent} from './activities/activity-detail-component';
import {SlotDetailComponent} from './slots/slot-detail-component';

export interface RouteAction {
  caption: string,
  icon: IconProp,
  type: undefined | 'submit' | 'click',
  click?: ((event: PointerEvent, router: Router) => void) | undefined,
}

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    title: 'Dashboard',
  },
  {
    path: 'client',
    component: Client,
    title: 'Client',
    data: {
      actions: [{
        caption: "Create", icon: ['fas', 'plus'],  type: 'click', click: (_event, router) => {
          router.navigate(['/client/new']).then();
        }
      }] as RouteAction[]
    }
  }, {
    path: 'client/:id',
    component: ClientDetail,
    title: 'Client Detail',
    data: {
      actions: [
        {caption: "Save", icon: ['fas', 'save'], type: 'submit'}
      ] as RouteAction[]
    },
  },
  {
    path: 'project',
    component: ProjectComponent,
    title: 'Project',
    data: {
      actions: [{
        caption: "Create", icon: ['fas', 'plus'],  type: 'click',click: (_event, router) => {
          router.navigate(['/project/new']);
        }
      }] as RouteAction[]
    }
  }, {
    path: 'project/:id',
    component: ProjectDetail,
    title: 'Project Detail',
    data: {
      actions: [
        {caption: "Save", icon: ['fas', 'save'], type: 'submit'}
      ] as RouteAction[]
    },
  },{
    path: 'project/:project-id/activity/:id',
    component: ActivityDetailComponent,
    title: 'Project Activity Detail',
    data: {
      actions: [
        {caption: "Save", icon: ['fas', 'save'], type: 'submit'}
      ] as RouteAction[]
    },
  },
  {
    path: 'project/:project-id/slot/:id',
    component: SlotDetailComponent,
    title: 'Project Slot Detail',
    data: {
      actions: [
        {caption: "Save", icon: ['fas', 'save'], type: 'submit'}
      ] as RouteAction[]
    },
  },
];
