import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  private opened = false;

  public getOpened() {
    return this.opened;
  }
  public setOpened(v: boolean) {
    this.opened = v;
  }
  public toggleOpened() {
    this.opened = !this.opened;
  }
}
