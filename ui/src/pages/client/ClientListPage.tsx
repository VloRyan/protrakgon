import { Col } from "react-bootstrap";
import { Link } from "wouter";
import { TypeIcon } from "../../components/TypeIcon.tsx";
import {
  Included,
  ResourceObject,
} from "@vloryan/ts-jsonapi-form/jsonapi/model/";

import { ReactElement } from "react";
import { QueryKey } from "@tanstack/query-core";
import { usePage } from "@vloryan/boot-api-ts/hooks/";
import { ItemActionCol } from "@vloryan/boot-api-ts/components/";
import { ItemListPage } from "@vloryan/boot-api-ts/pages";

export function ClientListPage() {
  const page = usePage();
  return (
    <ItemListPage
      searchProperty="name"
      itemCellsFunc={ClientCell}
      opts={{ page: page }}
    />
  );
}

function ClientCell(
  obj: ResourceObject,
  _: Included,
  queryKey: QueryKey,
): ReactElement {
  return (
    <>
      <Col>
        <span className="text-nowrap">
          <Link to={`/client/${obj.id}`}>
            <TypeIcon type={obj.type as string} className="me-1"></TypeIcon>
            {obj.attributes && obj.attributes.name
              ? (obj.attributes.name as string)
              : obj.id}
          </Link>
        </span>
      </Col>
      <Col>{obj.attributes!.description! as string}</Col>
      <ItemActionCol object={obj} queryKey={queryKey} />
    </>
  );
}
