import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { JsonApiService } from '../json-api.service';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { DocumentFormComponent } from '../document-form/document-form-component';
import { SingleResourceDoc } from '@vloryan/ts-jsonapi-form/jsonapi/model';

@Component({
  selector: 'app-activity-detail-component',
  imports: [MatCard, MatCardContent, MatFormField, MatLabel, MatInput],
  template: `
    <form id="item-form" (submit)="onSubmit($event)">
      <mat-card appearance="outlined">
        <mat-card-content>
          <mat-form-field
            floatLabel="always"
            [style.width.%]="49"
            [style.padding-right.%]="1"
          >
            <mat-label>Name</mat-label>
            <input
              matInput
              name="name"
              [defaultValue]="formValue('name')"
              (input)="onInput($event)"
            />
          </mat-form-field>
          <mat-form-field
            floatLabel="always"
            [style.width.%]="24"
            [style.padding-left.%]="1"
          >
            <mat-label>Unit</mat-label>
            <select matNativeControl name="Unit" (input)="onInput($event)">
              <option value="0" [selected]="formValue('unit') == 0">
                Time
              </option>
              <option value="1" [selected]="formValue('unit') == 1">
                Piece
              </option>
            </select>
          </mat-form-field>
          <mat-form-field
            floatLabel="always"
            [style.width.%]="24"
            [style.padding-left.%]="1"
          >
            <mat-label>Icon</mat-label>
            <input
              matInput
              name="icon"
              [defaultValue]="formValue('icon')"
              (input)="onInput($event)"
            />
          </mat-form-field>
          <br />
          <mat-form-field
            floatLabel="always"
            [style.width.%]="49"
            [style.padding-right.%]="1"
          >
            <mat-label>Amount</mat-label>
            <input
              type="number"
              matInput
              name="amount"
              [defaultValue]="
                form() != null && form()?.getValue('amount')
                  ? form()?.getValue('amount')
                  : ''
              "
              (input)="onInput($event)"
            />
          </mat-form-field>
          <mat-form-field
            floatLabel="always"
            [style.width.%]="49"
            [style.padding-left.%]="1"
          >
            <mat-label>Billable</mat-label>
            <select matNativeControl name="Unit" (input)="onInput($event)">
              <option value="0" [selected]="formValue('unit') == 0">
                Billable
              </option>
              <option value="1" [selected]="formValue('unit') == 1">
                Not billable
              </option>
            </select>
          </mat-form-field>
          <br />
          <mat-form-field floatLabel="always" [style.width.%]="100">
            <mat-label>Description</mat-label>
            <textarea
              matNativeControl
              name="description"
              rows="2"
              [defaultValue]="
                form() != null && form()?.getValue('description')
                  ? form()?.getValue('description')
                  : ''
              "
              (input)="onInput($event)"
            ></textarea>
          </mat-form-field>
        </mat-card-content>
      </mat-card>
    </form>
  `,
  styleUrl: './activity-detail-component.scss',
})
export class ActivityDetailComponent extends DocumentFormComponent {
  route: ActivatedRoute = inject(ActivatedRoute);
  jsonApiService: JsonApiService = inject(JsonApiService);

  constructor() {
    super('Activity', '', '');
    const projectId = this.route.snapshot.params['project-id'];
    this.baseUrl = 'project/' + projectId + '/activity';
    this.baseApiUrl = 'project/' + projectId + '/activity';
  }

  protected override loadDocument(): Promise<SingleResourceDoc | undefined> {
    const projectId = this.route.snapshot.params['project-id'];
    return this.jsonApiService.GetProjectActivity(
      projectId,
      this.route.snapshot.params['id'],
    );
  }
}
