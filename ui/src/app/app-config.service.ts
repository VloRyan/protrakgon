import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  apiUrl(){
    // @ts-expect-error will be added by server on prod
  return  window.SERVER_DATA != undefined ?  window.SERVER_DATA.apiUrl:"/api/v1/";
  }

  contextRoot(){
    // @ts-expect-error will be added by server on prod
    return window.SERVER_DATA != undefined ?  window.SERVER_DATA.contextRoot:"/";
  }

  appName(){
    return "ProTrakGon";
  }


}
