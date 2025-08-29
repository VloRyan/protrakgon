import { Col } from "react-bootstrap";
import { Link } from "wouter";
import { TypeIcon } from "../../components/TypeIcon.tsx";

import { ReactElement } from "react";

import { usePage } from "@vloryan/boot-api-ts/hooks/";
import { ItemActionCol } from "@vloryan/boot-api-ts/components/";
import { ItemListPage } from "@vloryan/boot-api-ts/pages";
import { ItemCellsFuncProps } from "@vloryan/boot-api-ts/components";

export function ClientListPage() {
  const page = usePage();
  return (
    <ItemListPage
      searchProperty="name"
      Cells={ClientCell}
      opts={{ page: page }}
    />
  );
}

function ClientCell({ obj, queryKey }: ItemCellsFuncProps): ReactElement {
  const objectUrl = `/client/${obj.id}`;
  return (
    <>
      <Col>
        <span className="text-nowrap">
          <Link to={objectUrl}>
            <TypeIcon type={obj.type as string} className="me-1"></TypeIcon>
            {obj.attributes && obj.attributes.name
              ? (obj.attributes.name as string)
              : obj.id}
          </Link>
        </span>
      </Col>
      <Col>{obj.attributes!.description! as string}</Col>
      <ItemActionCol objectUrl={objectUrl} queryKey={queryKey} />
    </>
  );
}
