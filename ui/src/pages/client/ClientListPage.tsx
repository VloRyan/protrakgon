import { ItemListPage } from "../../components/ItemListPage.tsx";
import { Col } from "react-bootstrap";
import { Link } from "wouter";
import { TypeIcon } from "../../components/TypeIcon.tsx";
import { ItemActionCol } from "../../components/ItemRow.tsx";
import { ResourceObject } from "ts-jsonapi-form/jsonapi/model/Objects.ts";
import { Included } from "ts-jsonapi-form/jsonapi/model/Document.ts";

import { ReactElement } from "react";
import { ApiToUiUrl } from "../../functions/url.ts";
import { QueryKey } from "@tanstack/query-core";

export function ClientListPage() {
  return <ItemListPage searchProperty="name" itemCellsFunc={ClientCell} />;
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
          <Link to={ApiToUiUrl(obj.links!.self as string)}>
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
//
