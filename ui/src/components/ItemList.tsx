import { useAlert } from "../hooks/UseAlert.ts";
import { LoadingSpinner } from "./LoadingSpinner.tsx";
import { PropsWithChildren, ReactElement, useEffect } from "react";
import { Container, Row } from "react-bootstrap";

import { PaginationRow } from "./Pagination.tsx";
import { ResourceObject } from "ts-jsonapi-form/jsonapi/model/Objects.ts";

import { Included } from "ts-jsonapi-form/jsonapi/model/Document.ts";
import { useSearch } from "wouter";
import { ItemRow } from "./ItemRow.tsx";

import { useQueryOpts } from "ts-jsonapi-form/hooks/UseQueryOpts.ts";
import { FetchOpts } from "ts-jsonapi-form/jsonapi/JsonApi.ts";
import { QueryKey } from "@tanstack/query-core";
import { useResources } from "../hooks/UseResource.ts";

export interface ItemListProps {
  url: string;
  itemCellsFunc?: (
    obj: ResourceObject,
    includes: Included,
    queryKey: QueryKey,
  ) => ReactElement;
  opts?: FetchOpts;
}

export const ItemList = ({
  url,
  opts,
  itemCellsFunc,
}: PropsWithChildren<ItemListProps>) => {
  const searchString = useSearch();
  const queryOpts = useQueryOpts(opts);
  const { doc, isLoading, error, queryKey } = useResources(url, queryOpts);
  const { addApiErrorAlerts } = useAlert();
  useEffect(() => {
    if (error) {
      addApiErrorAlerts(error);
    }
  }, [error]);
  if (error && !isLoading) {
    return null;
  }
  if (isLoading) {
    return <LoadingSpinner />;
  }
  if (!itemCellsFunc) {
    itemCellsFunc = (obj, queryKey) => {
      return <ItemRow object={obj} queryKey={queryKey} />;
    };
  }
  const itemCount = (doc?.meta["page[totalCount]"] as number) || 0;

  return (
    <>
      <Container fluid>
        {doc &&
          doc.data &&
          doc.data.map((item, index) => (
            <Row
              key={index}
              className={
                "border-bottom" + (index % 2 === 0 ? "" : " bg-body-secondary")
              }
            >
              {itemCellsFunc(item, doc?.included || [], queryKey)}
            </Row>
          ))}
      </Container>
      <PaginationRow
        location={url}
        searchString={searchString}
        offset={queryOpts.page?.offset ?? 0}
        totalPages={Math.ceil(itemCount / (queryOpts.page?.limit ?? 0))}
      />
    </>
  );
};
