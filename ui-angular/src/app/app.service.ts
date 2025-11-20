import {Injectable} from '@angular/core';
import {buildQueryString, FetchOpts, fetchResource, MEDIA_TYPE} from "../../../../../ts/ts-jsonapi-form/jsonapi";
import {CollectionResourceDoc} from '../../../../../ts/ts-jsonapi-form/jsonapi/model';
import {HttpClient} from '@angular/common/http';
import {Observable, tap} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppService {

  constructor(private http: HttpClient) {
  }

  async GetClients(): Promise<CollectionResourceDoc | undefined> {
    let opts: FetchOpts = {
      page: undefined,
      filter: undefined,
      includes: undefined,
      sort: undefined,
    };
    return fetchResource("/api/v1/client", opts).then((doc) => {
      if (doc) {
        return doc as CollectionResourceDoc;
      }
      return undefined;
    }).catch(() => {
      return undefined
    });
  }

  search(filter: { name: string } = {name: ''}, page = 0): Observable<CollectionResourceDoc | undefined> {
    let opts: FetchOpts = {
      page: {offset: page, limit: 10},
      filter: filter.name != ''? {name: filter.name}:undefined,
      includes: undefined,
      sort: undefined,
    };
    return this.http.get<CollectionResourceDoc>('/api/v1/client' + buildQueryString(opts), {headers: {"Content-Type": MEDIA_TYPE,}})
      .pipe(
        tap((response: CollectionResourceDoc) => {
          return response;
        })
      );
  }

}
