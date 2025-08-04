import { useAlert } from "../hooks/UseAlert.ts";
import { LoadingSpinner } from "./LoadingSpinner.tsx";
import { Fragment, PropsWithChildren, ReactElement, useEffect } from "react";
import { Col, Container, Row } from "react-bootstrap";

import { Pagination } from "./Pagination.tsx";
import { ResourceObject } from "ts-jsonapi-form/jsonapi/model/Objects.ts";

import { Included } from "ts-jsonapi-form/jsonapi/model/Document.ts";
import { useSearch } from "wouter";
import { ItemRow } from "./ItemRow.tsx";

import { extractFetchOpts } from "ts-jsonapi-form/jsonapi/Request.ts";
import { FetchOpts } from "ts-jsonapi-form/jsonapi/JsonApi.ts";
import { QueryKey } from "@tanstack/query-core";
import { useResources } from "../hooks/UseResource.ts";

export interface ItemGroup {
  id: string;
  headerFunc?: (group: ItemGroup) => ReactElement;
  data: ResourceObject[] | null;
}

export interface ItemListProps {
  resourcesUrl: string;
  locationUrl: string;
  itemCellsFunc?: (
    obj: ResourceObject,
    includes: Included,
    queryKey: QueryKey,
  ) => ReactElement;
  opts?: FetchOpts;
  groupFunc?: (objs: ResourceObject[]) => ItemGroup[];
}

export const ItemList = ({
  resourcesUrl,
  locationUrl,
  opts,
  itemCellsFunc,
  groupFunc,
}: PropsWithChildren<ItemListProps>) => {
  const searchString = useSearch();
  const queryOpts = extractFetchOpts(searchString, opts);
  const { doc, isLoading, error, queryKey } = useResources(
    resourcesUrl,
    queryOpts,
  );
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
  const itemGroups: ItemGroup[] = groupFunc
    ? groupFunc(doc?.data ? doc?.data : [])
    : [{ id: "0", data: doc?.data ? doc.data : null }];

  return (
    <Container fluid>
      {itemGroups.map((group) => {
        return (
          <Fragment key={group.id}>
            <GroupHeader group={group} />
            <GroupDataRows
              group={group}
              itemCellsFunc={itemCellsFunc}
              queryKey={queryKey}
              included={doc?.included}
            />
          </Fragment>
        );
      })}
      {queryOpts.page?.limit && (
        <Row className="mt-2">
          <Col className="text-center">
            <Pagination
              location={locationUrl}
              searchString={searchString}
              offset={queryOpts.page?.offset ? queryOpts.page?.offset : 0}
              totalPages={Math.ceil(
                itemCount / (queryOpts.page?.limit ? queryOpts.page?.limit : 0),
              )}
            />
          </Col>
        </Row>
      )}
    </Container>
  );
};
const GroupDataRows = ({
  group,
  itemCellsFunc,
  queryKey,
  included,
}: {
  group: ItemGroup;
  itemCellsFunc: (
    obj: ResourceObject,
    includes: Included,
    queryKey: QueryKey,
  ) => ReactElement;
  queryKey: QueryKey;
  included?: Included;
}) => {
  return group.data?.map((item, index) => (
    <Row
      key={index}
      className={
        "align-items-center" +
        (index + 1 != group.data?.length ? "" : " border-bottom border-2") +
        (index % 2 === 0 ? "" : " bg-body-secondary")
      }
    >
      {itemCellsFunc(item, included || [], queryKey)}
    </Row>
  ));
};

const GroupHeader = ({ group }: { group: ItemGroup }) => {
  return (
    group.headerFunc && (
      <Row className="align-items-center">{group.headerFunc(group)}</Row>
    )
  );
};
