import { Toolbar } from "./Toolbar.tsx";
import { PropsWithChildren, ReactElement } from "react";
import { useLocation } from "wouter";
import { ObjectForm } from "ts-jsonapi-form/form/ObjectForm.ts";
import { ItemList } from "./ItemList.tsx";
import { ResourceObject } from "ts-jsonapi-form/jsonapi/model/Objects.ts";
import { Included } from "ts-jsonapi-form/jsonapi/model/Document.ts";

import { SERVER_API_PATH } from "../Config.ts";
import { FetchOpts } from "ts-jsonapi-form/jsonapi/JsonApi.ts";
import { joinPath } from "../functions/url.ts";
import { QueryKey } from "@tanstack/query-core";

export interface ItemListPageProps {
  itemCellsFunc?: (
    obj: ResourceObject,
    includes: Included,
    queryKey: QueryKey,
  ) => ReactElement;
  opts?: FetchOpts;
  searchProperty?: string;
  searchBarContent?: (form: ObjectForm) => ReactElement;
}

export const ItemListPage = ({
  opts,
  itemCellsFunc,
  searchProperty,
  searchBarContent,
}: PropsWithChildren<ItemListPageProps>) => {
  const [location] = useLocation();
  const url = joinPath(SERVER_API_PATH, `/v1/`, location);
  return (
    <>
      <Toolbar
        createButton={{ name: "create" }}
        searchProperty={searchProperty}
        searchBarContent={searchBarContent}
      ></Toolbar>
      <ItemList url={url} itemCellsFunc={itemCellsFunc} opts={opts} />
    </>
  );
};
