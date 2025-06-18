import { DeleteButton } from "./Buttons.tsx";

import { ResourceObject } from "ts-jsonapi-form/jsonapi/model/Objects.ts";
import { deleteResource } from "ts-jsonapi-form/jsonapi/JsonApi.ts";

import { TypeIcon } from "./TypeIcon.tsx";
import { useAlert } from "../hooks/UseAlert.ts";

import { Col } from "react-bootstrap";
import { Children, PropsWithChildren } from "react";
import { SERVER_API_PATH } from "../Config.ts";
import { joinPath } from "../functions/url.ts";
import { QueryKey } from "@tanstack/query-core";
import { useQueryClient } from "@tanstack/react-query";

export interface ListItemCardProps {
  object: ResourceObject;
  queryKey: QueryKey;
}

export function ItemRow({ object, queryKey }: ListItemCardProps) {
  return (
    <>
      <Col>
        <TypeIcon type={object.type as string} className="me-1"></TypeIcon>
        {object.attributes && object.attributes.name
          ? (object.attributes.name as string)
          : object.id}
      </Col>
      <ItemActionCol object={object} queryKey={queryKey} />
    </>
  );
}
interface ItemActionColProps {
  object: ResourceObject;
  queryKey: QueryKey;
}
export const ItemActionCol = ({
  object,
  queryKey,
  children,
}: PropsWithChildren<ItemActionColProps>) => {
  const { addApiErrorAlerts } = useAlert();
  const queryClient = useQueryClient();
  return (
    <Col className="col-auto d-flex justify-content-end">
      {Children.map(children, (child) => (
        <div className="me-1">{child}</div>
      ))}
      <DeleteButton
        size="sm"
        onClick={() => {
          deleteResource(
            joinPath(SERVER_API_PATH, object.links!.self as string),
          ).then(
            () => {
              queryClient.invalidateQueries({ queryKey }).then();
            },
            (error) => addApiErrorAlerts(error),
          );
        }}
      ></DeleteButton>
    </Col>
  );
};
