import { ItemListPage } from "@vloryan/boot-api-ts/pages";
import { Col } from "react-bootstrap";
import { Link } from "wouter";
import { TypeIcon } from "../../components/TypeIcon.tsx";
import { ItemActionCol } from "@vloryan/boot-api-ts/components/";
import {
  Included,
  ResourceIdentifierObject,
  ResourceObject,
} from "@vloryan/ts-jsonapi-form/jsonapi/model/";

import { JSX, ReactElement } from "react";
import { TrackingButton } from "../../components/project/TrackingButton.tsx";
import { findInclude } from "@vloryan/ts-jsonapi-form/jsonapi/";
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
  let clientCol: JSX.Element | null = null;
  const client = findInclude(
    obj.relationships!.client.data as ResourceIdentifierObject,
    included,
  );
  if (client) {
    clientCol = (
      <Col sm={1}>
        <span className="text-nowrap">
          <Link to={`/client/${client.id}`}>
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
          <Link to={`/project/${obj.id}`}>
            <TypeIcon type={obj.type as string} className="me-1"></TypeIcon>
            {obj.attributes && obj.attributes.name
              ? (obj.attributes.name as string)
              : obj.id}
          </Link>
        </span>
      </Col>
      {clientCol}
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
