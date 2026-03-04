import { Component, Inject, inject, OnInit, signal } from '@angular/core';
import { DocumentForm, DocumentFormProps } from '@vloryan/ts-jsonapi-form/form';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ApiError,
  SingleResourceDoc,
} from '@vloryan/ts-jsonapi-form/jsonapi/model';
import { Router } from '@angular/router';
import { joinPath } from '@vloryan/ts-jsonapi-form/functions';
import { AppConfigService } from '../app-config.service';

@Component({
  selector: 'app-document-form-component',
  imports: [],
  template: '',
})
export abstract class DocumentFormComponent implements OnInit {
  appConfig = inject(AppConfigService);
  protected objectName: string = '';
  protected baseUrl: string = '';
  protected baseApiUrl: string = '';
  protected form = signal<DocumentForm | null>(null);
  protected isLoading = signal<boolean>(false);
  private snackBar = inject(MatSnackBar);
  private router: Router = inject(Router);

  protected constructor(
    @Inject(String) objectName: string,
    @Inject(String) baseUrl: string,
    @Inject(String) baseApiUrl: string,
  ) {
    this.objectName = objectName;
    this.baseUrl = baseUrl;
    this.baseApiUrl = baseApiUrl;
  }

  ngOnInit() {
    this.refreshForm();
  }
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  formValue(path: string): any {
    return this.form() != null ? (this.form()?.getValue(path) ?? '') : '';
  }

  onInput(ev: Event) {
    this.form()?.handleChangeEvent(ev);
  }

  onSubmit(ev: Event) {
    ev.stopPropagation();
    ev.preventDefault();
    const verb = this.form()?.hasResourceId() ? 'update' : 'create';
    this.form()
      ?.submit()
      .then((doc) => {
        const object = doc?.data;
        if (!object) {
          return;
        }
        this.router
          .navigate([this.baseUrl, object.id], {
            replaceUrl: true,
          })
          .then(() => {
            this.form.set(
              new DocumentForm({
                document: doc,
                apiUrl: joinPath(
                  this.appConfig.apiUrl(),
                  this.baseApiUrl,
                  object.id,
                ),
              } satisfies DocumentFormProps),
            );
            this.snackBar.open(
              this.objectName + ' ' + verb + 'd successfully.',
              '',
              {
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['success-snackbar'],
                duration: 3000,
              },
            );
          })
          .catch((error) => {
            console.log(error);
          });
      })
      .catch((error) => {
        let cause = error.message;
        if ((error as ApiError).errors != undefined) {
          cause = (error as ApiError).errors.map((e) => '\n ' + e.detail);
        }
        this.snackBar.open(
          'Failed to ' + verb + ' ' + this.objectName + ': ' + cause,
          '',
          {
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
            duration: 3000,
          },
        );
      });
  }

  protected refreshForm() {
    this.isLoading.set(true);
    this.loadDocument().then((doc) => {
      const theDoc = doc ? doc : null;
      const props = {
        document: theDoc,
        apiUrl: joinPath(
          this.appConfig.apiUrl(),
          this.baseApiUrl,
          theDoc?.data.id ? theDoc!.data.id : '',
        ),
      } satisfies DocumentFormProps;
      const form = new DocumentForm(props);
      this.form.set(form);
      this.isLoading.set(false);
      this.afterLoadForm();
    });
  }

  protected abstract loadDocument(): Promise<SingleResourceDoc | undefined>;

  protected afterLoadForm() {}
}
