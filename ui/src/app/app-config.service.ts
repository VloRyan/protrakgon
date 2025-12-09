import { Injectable } from '@angular/core';
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
declare const window: any; // @see https://stackoverflow.com/questions/12709074/how-do-you-explicitly-set-a-new-property-on-window-in-typescript/56402425#56402425
@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  apiUrl() {
    return window.SERVER_DATA != undefined
      ? window.SERVER_DATA.apiUrl
      : '/api/v1/';
  }

  contextRoot() {
    return window.SERVER_DATA != undefined
      ? window.SERVER_DATA.contextRoot
      : '/';
  }

  appName() {
    return 'ProTrakGon';
  }
}
