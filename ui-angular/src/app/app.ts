import {Component, signal} from '@angular/core';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {FaIconLibrary, FontAwesomeModule,} from '@fortawesome/angular-fontawesome';
import {fas} from '@fortawesome/free-solid-svg-icons';
import {far,} from '@fortawesome/free-regular-svg-icons';
import {MatIconModule} from '@angular/material/icon';
import {Toolbar} from './toolbar/toolbar';
import {SidebarComponent} from './sidebar/sidebar.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatSlideToggleModule, MatIconModule, FontAwesomeModule, Toolbar, SidebarComponent],
  template: `
    <app-toolbar appName="{{appName()}}"></app-toolbar>
    <app-sidebar></app-sidebar>
  `,
  styleUrl: './app.scss'
})
export class App {
  protected readonly appName = signal('Protrakgon');
  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas, far);
  }
}
