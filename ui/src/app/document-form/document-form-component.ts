import {Component, Inject, inject, OnInit, signal} from '@angular/core';
import {DocumentForm, DocumentFormProps} from '@vloryan/ts-jsonapi-form/form';
import {MatSnackBar} from '@angular/material/snack-bar';
import {SingleResourceDoc} from '@vloryan/ts-jsonapi-form/jsonapi/model';
import {Router} from '@angular/router';
import {joinPath} from '@vloryan/ts-jsonapi-form/functions';
import {AppConfigService} from '../app-config.service';

@Component({
  selector: 'app-document-form-component',
  imports: [],
  template: '',
})
export abstract class DocumentFormComponent implements OnInit {
  appConfig = inject(AppConfigService)
 protected objectName :string="";
  protected baseUrl :string="";
  protected baseApiUrl :string="";
  protected form = signal<DocumentForm | null>(null);
  protected isLoading = signal<boolean>(false);
  private snackBar = inject(MatSnackBar);
  private router: Router = inject(Router);

  protected constructor(@Inject(String) objectName:string,@Inject(String) baseUrl:string,@Inject(String) baseApiUrl:string) {
    this.objectName=objectName
    this.baseUrl=baseUrl
    this.baseApiUrl=baseApiUrl
  }

  ngOnInit() {
    this.refreshForm();
  }

  formValue(path:string):any{
    return this.form() != null ? this.form()?.getValue(path) ?? '':''
  }

  onInput(ev: Event) {
    this.form()?.handleChangeEvent(ev);
  }

  onSubmit(ev: Event) {
    ev.stopPropagation();
    ev.preventDefault();
    const verb = this.form()?.hasResourceId()?"update":"create";
    this.form()?.submit().then((doc) => {
      const object = doc?.data;
      if (!object) {
        return;
      }

      this.snackBar.open(this.objectName+ ' '+verb+'d successfully.', '', {
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['success-snackbar'],
        duration: 3000,
      });
      this.router.navigate([this.appConfig.contextRoot(),this.baseUrl, object.id],{replaceUrl:true}).then(
        () => {
          this.form.set(new DocumentForm({
            document: doc,
            apiUrl:  joinPath(this.appConfig.apiUrl(),this.baseApiUrl, object.id )
          }                      satisfies DocumentFormProps));
        }
      );
    }).catch((error) => {
      this.snackBar.open('Failed to '+verb+' ' + this.objectName + ': ' + error.message, '', {
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar'],
        duration: 3000,
      });
    })

  }

  protected refreshForm(){
    this.isLoading.set(true);
    this.loadDocument().then((doc) => {
      let theDoc = doc ? doc : null;
      let props = {
        document: theDoc,
        apiUrl: joinPath(this.appConfig.apiUrl(),this.baseApiUrl,(theDoc?.data.id ?  theDoc!.data.id : "") )
      } satisfies DocumentFormProps;
      let form = new DocumentForm(props);
      this.form.set(form);
      this.isLoading.set(false);
      this.afterLoadForm();
    });
  }

  protected abstract loadDocument(): Promise<SingleResourceDoc | undefined>;

  protected  afterLoadForm(){};
}
