import { inject, Injectable } from '@angular/core';
import {
  buildQueryString,
  deleteResource,
  FetchOpts,
  fetchResource,
  InvalidServerResponseError,
  MEDIA_TYPE,
} from '@vloryan/ts-jsonapi-form/jsonapi';
import {
  ApiError,
  CollectionResourceDoc,
  type Document as APIDocument,
  SingleResourceDoc,
} from '@vloryan/ts-jsonapi-form/jsonapi/model';
import { AppConfigService } from './app-config.service';
import { joinPath } from '@vloryan/ts-jsonapi-form/functions';
import { Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ObjectLike } from '@vloryan/ts-jsonapi-form/jsonapi/model/Types';
import { StatusCodes } from 'http-status-codes';

@Injectable({
  providedIn: 'root',
})
export class JsonApiService {
  appConfig = inject(AppConfigService);
  http = inject(HttpClient);
  public emptyOpts: FetchOpts = {
    page: undefined,
    filter: undefined,
    includes: undefined,
    sort: undefined,
  };

  async GetClients(): Promise<CollectionResourceDoc | undefined> {
    const opts: FetchOpts = {
      page: undefined,
      filter: undefined,
      includes: undefined,
      sort: undefined,
    };
    return fetchResource(joinPath(this.appConfig.apiUrl(), 'client'), opts)
      .then((doc) => {
        if (doc) {
          return doc as CollectionResourceDoc;
        }
        return undefined;
      })
      .catch(() => {
        return undefined;
      });
  }

  SearchForClient(
    filter: { name: string } = { name: '' },
    page = 0,
  ): Observable<CollectionResourceDoc | undefined> {
    const opts: FetchOpts = {
      page: { offset: page, limit: 10 },
      filter: filter.name != '' ? { name: filter.name } : undefined,
      includes: undefined,
      sort: undefined,
    };
    return this.http
      .get<CollectionResourceDoc>(
        joinPath(this.appConfig.apiUrl(), 'client') + buildQueryString(opts),
        { headers: { 'Content-Type': MEDIA_TYPE } },
      )
      .pipe(
        tap((response: CollectionResourceDoc) => {
          return response;
        }),
      );
  }

  async GetClient(id: string): Promise<SingleResourceDoc | undefined> {
    const opts: FetchOpts = {
      page: undefined,
      filter: undefined,
      includes: undefined,
      sort: undefined,
    };
    return fetchResource(joinPath(this.appConfig.apiUrl(), 'client/', id), opts)
      .then((doc) => {
        if (doc) {
          return doc as SingleResourceDoc;
        }
        return undefined;
      })
      .catch(() => {
        return undefined;
      });
  }

  async DeleteClient(id: string) {
    const opts: FetchOpts = {
      page: undefined,
      filter: undefined,
      includes: undefined,
      sort: undefined,
    };
    return deleteResource(
      joinPath(this.appConfig.apiUrl(), 'client/', id),
      opts,
    );
  }

  async GetProjects(): Promise<CollectionResourceDoc | undefined> {
    const opts: FetchOpts = {
      page: undefined,
      filter: undefined,
      includes: ['client'],
      sort: undefined,
    };
    return fetchResource(joinPath(this.appConfig.apiUrl(), 'project'), opts)
      .then((doc) => {
        if (doc) {
          return doc as CollectionResourceDoc;
        }
        return undefined;
      })
      .catch(() => {
        return undefined;
      });
  }

  async GetProject(id: string): Promise<SingleResourceDoc | undefined> {
    const opts: FetchOpts = {
      page: undefined,
      filter: undefined,
      includes: ['client'],
      sort: undefined,
    };
    return fetchResource(
      joinPath(this.appConfig.apiUrl(), 'project/', id),
      opts,
    )
      .then((doc) => {
        if (doc) {
          return doc as SingleResourceDoc;
        }
        return undefined;
      })
      .catch(() => {
        return undefined;
      });
  }

  async DeleteProject(id: string) {
    const opts: FetchOpts = {
      page: undefined,
      filter: undefined,
      includes: undefined,
      sort: undefined,
    };
    return deleteResource(
      joinPath(this.appConfig.apiUrl(), 'project/', id),
      opts,
    );
  }

  async GetProjectActivities(
    projectId: string,
    filter: ObjectLike | undefined = undefined,
  ): Promise<CollectionResourceDoc | undefined> {
    const opts: FetchOpts = {
      page: undefined,
      filter: filter,
      includes: undefined,
      sort: undefined,
    };
    return fetchResource(
      joinPath(this.appConfig.apiUrl(), 'project/', projectId, '/activity'),
      opts,
    )
      .then((doc) => {
        if (doc) {
          return doc as CollectionResourceDoc;
        }
        return undefined;
      })
      .catch(() => {
        return undefined;
      });
  }

  async GetProjectActivity(
    projectId: string,
    id: string,
  ): Promise<SingleResourceDoc | undefined> {
    const opts: FetchOpts = {
      page: undefined,
      filter: undefined,
      includes: undefined,
      sort: undefined,
    };
    return fetchResource(
      joinPath(
        this.appConfig.apiUrl(),
        'project/',
        projectId,
        '/activity/',
        id,
      ),
      opts,
    )
      .then((doc) => {
        if (doc) {
          return doc as SingleResourceDoc;
        }
        return undefined;
      })
      .catch(() => {
        return undefined;
      });
  }

  async DeleteActivity(projectId: string, id: string) {
    const opts: FetchOpts = {
      page: undefined,
      filter: undefined,
      includes: undefined,
      sort: undefined,
    };
    return deleteResource(
      joinPath(
        this.appConfig.apiUrl(),
        'project/',
        projectId,
        '/activity/',
        id,
      ),
      opts,
    );
  }

  async GetProjectBookings(
    projectId: string,
    opts: FetchOpts = this.emptyOpts,
  ): Promise<CollectionResourceDoc | undefined> {
    return fetchResource(
      joinPath(this.appConfig.apiUrl(), 'project/', projectId, '/booking'),
      opts,
    )
      .then((doc) => {
        if (doc) {
          return doc as CollectionResourceDoc;
        }
        return undefined;
      })
      .catch(() => {
        return undefined;
      });
  }

  async GetProjectBooking(
    projectId: string,
    id: string,
  ): Promise<SingleResourceDoc | undefined> {
    const opts: FetchOpts = {
      page: undefined,
      filter: undefined,
      includes: undefined,
      sort: undefined,
    };
    return fetchResource(
      joinPath(this.appConfig.apiUrl(), 'project/', projectId, '/booking/', id),
      opts,
    )
      .then((doc) => {
        if (doc) {
          return doc as SingleResourceDoc;
        }
        return undefined;
      })
      .catch(() => {
        return undefined;
      });
  }

  async DeleteBooking(projectId: string, id: string) {
    const opts: FetchOpts = {
      page: undefined,
      filter: undefined,
      includes: undefined,
      sort: undefined,
    };
    return deleteResource(
      joinPath(this.appConfig.apiUrl(), 'project/', projectId, '/booking/', id),
      opts,
    );
  }

  async AddBookingsBulk(projectId: string, text: string) {
    /*let doc = createDocument({
      type: 'project.booking.bulk',
      attributes: { text: text } as AttributesObject,
    } as ResourceObject);
    return updateResource(
      joinPath(this.appConfig.apiUrl(), 'project/', projectId, '/booking/bulk'),
      doc,
    );*/
    let bodyObject = { lines: text.split('\n') };
    return fetch(
      joinPath(this.appConfig.apiUrl(), 'project/', projectId, '/booking/bulk'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyObject),
      },
    ).then(async (resp) => {
      if (resp.status == StatusCodes.NO_CONTENT) {
        return null;
      }
      if (!resp.headers.get('content-type')?.startsWith(MEDIA_TYPE)) {
        throw InvalidServerResponseError(resp);
      }
      const doc = (await resp.json()) as APIDocument;
      if (!resp.ok) {
        if (!doc.errors) {
          throw new Error(
            'Unknown server error: ' + resp.status + ' - ' + resp.statusText,
          );
        }
        throw new ApiError(doc.errors);
      }
      return doc;
    });
  }
}
