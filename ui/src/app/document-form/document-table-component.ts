import { Component, Inject, inject, OnInit, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ApiError,
  CollectionResourceDoc,
  Document as ApiDocument,
  PrimaryData,
  ResourceObject,
} from '@vloryan/ts-jsonapi-form/jsonapi/model';

export interface Group {
  caption: string;
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  data: any;
}

@Component({
  selector: 'app-document-table-component',
  imports: [],
  template: '',
})
export abstract class DocumentTableComponent implements OnInit {
  protected rows = signal<(Group | ResourceObject)[]>([]);
  protected objectName: string = '';
  protected isLoading = signal<boolean>(false);
  private snackBar = inject(MatSnackBar);

  protected constructor(@Inject(String) objectName: string) {
    this.objectName = objectName;
  }

  ngOnInit() {
    this.refreshRows();
  }

  deleteItem(event: PointerEvent, id: string) {
    event.stopPropagation();
    event.preventDefault();
    this.deleteObject(id)
      .then(() => {
        this.snackBar.open(this.objectName + ' deleted', '', {
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar'],
          duration: 3000,
        });
        this.loadDocument().then((doc: CollectionResourceDoc | undefined) => {
          this.rows.set(this.asRows(doc));
        });
      })
      .catch((err) => {
        if ((err as ApiError).errors != undefined) {
          for (const oneError of (err as ApiError).errors) {
            this.snackBar.open(
              oneError.title ? oneError.title : 'Error occurred',
              '',
              {
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['error-snackbar'],
                duration: 3000,
              },
            );
            console.log(oneError.detail);
          }
        } else {
          console.log(err);
        }
      });
  }
  protected refreshRows() {
    this.isLoading.set(true);
    this.loadDocument().then((doc) => {
      this.rows.set(this.asRows(doc));
      this.isLoading.set(false);
    });
  }

  protected asRows(
    doc: CollectionResourceDoc | undefined,
  ): (Group | ResourceObject)[] {
    return doc ? doc.data : [];
  }

  protected abstract loadDocument(): Promise<CollectionResourceDoc | undefined>;

  protected abstract deleteObject(
    id: string,
  ): Promise<ApiDocument<PrimaryData> | null>;
}
