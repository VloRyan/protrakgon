import { ItemListPage } from "../../components/ItemListPage.tsx";
import { Col } from "react-bootstrap";
import { Link } from "wouter";
import { TypeIcon } from "../../components/TypeIcon.tsx";
import { ItemActionCol } from "../../components/ItemRow.tsx";
import {
  ResourceIdentifierObject,
  ResourceObject,
} from "ts-jsonapi-form/jsonapi/model/Objects.ts";
import { Included } from "ts-jsonapi-form/jsonapi/model/Document.ts";

import { JSX, ReactElement } from "react";
import { TrackingButton } from "../../components/project/TrackingButton.tsx";
import { ApiToUiUrl } from "../../functions/url.ts";
import { findInclude } from "ts-jsonapi-form/jsonapi/JsonApi.ts";
import { QueryKey } from "@tanstack/query-core";

export function ProjectListPage() {
  const isMobile = window.screen.width < 576;
  return (
    <ItemListPage
      searchProperty="name"
      itemCellsFunc={ProjectCell}
      opts={{ includes: !isMobile ? ["client"] : [] }}
    />
  );
}

function ProjectCell(
  obj: ResourceObject,
  included: Included,
  queryKey: QueryKey,
): ReactElement {
  let clientRow: JSX.Element | null = null;
  const client = findInclude(
    obj.relationships!.client.data as ResourceIdentifierObject,
    included,
  );
  if (client) {
    clientRow = (
      <Col sm={1}>
        <span className="text-nowrap">
          <Link to={ApiToUiUrl(client.links!.self as string)}>
            <TypeIcon type={client.type as string} className="me-1"></TypeIcon>
            {client.attributes && client.attributes.name
              ? (client.attributes.name as string)
              : client.id}
          </Link>
        </span>
      </Col>
    );
  }

  return (
    <>
      <Col>
        <span className="text-nowrap">
          <Link to={ApiToUiUrl(obj.links!.self as string)}>
            <TypeIcon type={obj.type as string} className="me-1"></TypeIcon>
            {obj.attributes && obj.attributes.name
              ? (obj.attributes.name as string)
              : obj.id}
          </Link>
        </span>
      </Col>
      {clientRow}
      <Col className="d-md-block">
        <div className="d-none">{obj.attributes!.description! as string}</div>
      </Col>
      <ItemActionCol object={obj} queryKey={queryKey}>
        <TrackingButton projectId={obj.id} variant="success" size="sm" />
      </ItemActionCol>
    </>
  );
}
//
