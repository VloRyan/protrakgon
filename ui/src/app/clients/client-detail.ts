import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { JsonApiService } from '../json-api.service';

import { DocumentFormComponent } from '../document-form/document-form-component';
import { SingleResourceDoc } from '@vloryan/ts-jsonapi-form/jsonapi/model';

@Component({
  selector: 'app-client-detail',
  imports: [MatFormFieldModule, MatInputModule],
  template: `
    <form id="item-form" (submit)="onSubmit($event)">
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
        <mat-label>Description</mat-label>
        <input
          matInput
          name="description"
          [defaultValue]="formValue('description')"
          (input)="onInput($event)"
        />
      </mat-form-field>
    </form>
  `,
  styleUrl: './client-detail.scss',
})
export class ClientDetail extends DocumentFormComponent {
  route: ActivatedRoute = inject(ActivatedRoute);
  jsonApiService: JsonApiService = inject(JsonApiService);
  constructor() {
    super('Client', 'client', 'client');
  }
  protected override loadDocument(): Promise<SingleResourceDoc | undefined> {
    return this.jsonApiService.GetClient(this.route.snapshot.params['id']);
  }
}
