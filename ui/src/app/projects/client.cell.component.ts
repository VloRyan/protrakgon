import {Component, input} from '@angular/core';
import {Included, ResourceIdentifierObject, ResourceObject} from '@vloryan/ts-jsonapi-form/jsonapi/model';
import {findInclude} from '@vloryan/ts-jsonapi-form/jsonapi';

@Component({
  selector: 'app-project-client-cell',
  template: `
    <div class="results">{{ClientName() }}</div>
  `,
  styles:'',
})
export class ProjectClientCell {
  client: ResourceObject | null = null;
  item = input.required<ResourceObject>();
  included = input<Included>();
  constructor() {

  }
  ClientName(){
    if (this.item().relationships && this.item().relationships!["client"]) {
      this.client = findInclude(
        this.item().relationships!["client"]!.data as ResourceIdentifierObject,
        this.included() !== undefined ? this.included()! : [] as Included,
      );
      return this.client!.attributes!["name"];
    }
    return "";
  }
}
