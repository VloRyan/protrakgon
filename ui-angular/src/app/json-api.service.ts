import {Injectable} from '@angular/core';
import {deleteResource, FetchOpts, fetchResource} from "../../../../../ts/ts-jsonapi-form/jsonapi";
import {CollectionResourceDoc, SingleResourceDoc} from '../../../../../ts/ts-jsonapi-form/jsonapi/model';

@Injectable({
  providedIn: 'root',
})
export class JsonApiService {
  public emptyOpts: FetchOpts = {
    page: undefined,
    filter: undefined,
    includes: undefined,
    sort: undefined,};
  async GetClients(): Promise<CollectionResourceDoc|undefined> {
    let opts: FetchOpts = {
      page: undefined,
      filter: undefined,
      includes: undefined,
      sort: undefined,};
    return fetchResource("/api/v1/client", opts).then((doc) => {
      if (doc) {
        return doc as CollectionResourceDoc;
      }
      return undefined;
    }).catch(() => {
      return undefined
    });
  }

  async GetClient(id:string): Promise<SingleResourceDoc|undefined> {
    let opts: FetchOpts = {page: undefined,
      filter: undefined,
      includes: undefined,
      sort: undefined,};
    return fetchResource("/api/v1/client/"+id, opts).then((doc) => {
      if (doc) {
        return doc as SingleResourceDoc;
      }
      return undefined;
    }).catch(() => {
      return undefined
    });
  }

  async DeleteClient(id:string) {
    let opts: FetchOpts = {page: undefined,
      filter: undefined,
      includes: undefined,
      sort: undefined,};
    return deleteResource("/api/v1/client/"+id, opts);
  }

  async GetProjects(): Promise<CollectionResourceDoc|undefined> {
    let opts: FetchOpts = {page: undefined,
      filter: undefined,
      includes: ['client'],
      sort: undefined,};
    return fetchResource("/api/v1/project", opts).then((doc) => {
      if (doc) {
        return doc as CollectionResourceDoc;
      }
      return undefined;
    }).catch(() => {
      return undefined
    });
  }

  async GetProject(id:string): Promise<SingleResourceDoc|undefined> {
    let opts: FetchOpts = {
      page: undefined,
      filter: undefined,
      includes: ['client'],
      sort: undefined,};
    return fetchResource("/api/v1/project/"+id, opts).then((doc) => {
      if (doc) {
        return doc as SingleResourceDoc;
      }
      return undefined;
    }).catch(() => {
      return undefined
    });
  }

  async DeleteProject(id:string) {
    let opts: FetchOpts = {page: undefined,
      filter: undefined,
      includes: undefined,
      sort: undefined,};
    return deleteResource("/api/v1/project/"+id, opts);
  }

  async GetProjectActivities(projectId:string): Promise<CollectionResourceDoc|undefined> {
    let opts: FetchOpts = {page: undefined,
      filter: undefined,
      includes: undefined,
      sort: undefined,};
    return fetchResource("/api/v1/project/"+projectId+"/activity", opts).then((doc) => {
      if (doc) {
        return doc as CollectionResourceDoc;
      }
      return undefined;
    }).catch(() => {
      return undefined
    });
  }

  async GetProjectActivity(projectId:string,id:string): Promise<SingleResourceDoc|undefined> {
    let opts: FetchOpts = {page: undefined,
      filter: undefined,
      includes: undefined,
      sort: undefined,};
    return fetchResource("/api/v1/project/"+projectId+"/activity/"+id, opts).then((doc) => {
      if (doc) {
        return doc as SingleResourceDoc;
      }
      return undefined;
    }).catch(() => {
      return undefined
    });
  }

  async DeleteActivity(projectId:string,id:string) {
    let opts: FetchOpts = {page: undefined,
      filter: undefined,
      includes: undefined,
      sort: undefined,};
    return deleteResource("/api/v1/project/"+projectId+"/activity/"+id, opts);
  }

  async GetProjectSlots(projectId:string,opts: FetchOpts=this.emptyOpts): Promise<CollectionResourceDoc|undefined> {
    return fetchResource("/api/v1/project/"+projectId+"/slot", opts).then((doc) => {
      if (doc) {
        return doc as CollectionResourceDoc;
      }
      return undefined;
    }).catch(() => {
      return undefined
    });
  }

  async GetProjectSlot(projectId:string,id:string): Promise<SingleResourceDoc|undefined> {
    let opts: FetchOpts = {page: undefined,
      filter: undefined,
      includes: undefined,
      sort: undefined,};
    return fetchResource("/api/v1/project/"+projectId+"/slot/"+id, opts).then((doc) => {
      if (doc) {
        return doc as SingleResourceDoc;
      }
      return undefined;
    }).catch(() => {
      return undefined
    });
  }

  async DeleteSlot(projectId:string,id:string) {
    let opts: FetchOpts = {page: undefined,
      filter: undefined,
      includes: undefined,
      sort: undefined,};
    return deleteResource("/api/v1/project/"+projectId+"/slot/"+id, opts);
  }

}
