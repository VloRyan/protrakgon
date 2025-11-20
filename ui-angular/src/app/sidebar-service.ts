import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  private _showSidebar = false;

  public get showSidebar() {
    return this._showSidebar ;
  }

  public set showSidebar(v : boolean) {
    this._showSidebar = v;
  }

  public  toggleSidebar(){
     this._showSidebar = !this._showSidebar;
  }
}
