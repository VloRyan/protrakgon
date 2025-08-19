import { capitalize } from "@vloryan/boot-api-ts/functions/";
import { ButtonProps } from "react-bootstrap/Button";
import {
  useAlert,
  useResourceObjectForm,
  useResources,
} from "@vloryan/boot-api-ts/hooks/";
import { FormEvent, useEffect } from "react";
import { apiPath } from "../../functions/url.ts";
import { LoadingSpinner } from "@vloryan/boot-api-ts/components/";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import Dropdown from "react-bootstrap/Dropdown";
import { LinksObject } from "@vloryan/ts-jsonapi-form/jsonapi/model/";

export interface TrackingButtonProps extends ButtonProps {
  projectId: string;
}
export const TrackingButton = (props: TrackingButtonProps) => {
  const { addApiErrorAlerts, clearAlerts } = useAlert();
  useEffect(() => {
    clearAlerts();
  }, []);
  const openSlots = useResources(apiPath(`/project/${props.projectId}/slot`), {
    filter: { isOpen: true },
  });
  const activities = useResources(apiPath("/project/activity"));
  useEffect(() => {
    if (openSlots.error || activities.error) {
      addApiErrorAlerts(openSlots.error ? openSlots.error : activities.error!);
    }
  }, [openSlots.error, activities.error]);
  const slotForm = useResourceObjectForm({
    document: {
      data: {
        id: "",
        type: "slot",
        attributes: { projectId: +props.projectId },
        links: {
          self: apiPath(`/project/${props.projectId}/slot`),
        },
      },
    },
    queryKey: openSlots.queryKey,
  });
  if (openSlots.error || activities.error) {
    return <></>;
  }
  if (openSlots.isLoading || activities.isLoading) {
    return <LoadingSpinner size="sm" />;
  }
  if (openSlots.doc && openSlots.doc.data && openSlots.doc.data.length > 0) {
    return (
      <div>
        {openSlots.doc.data.map((item) => (
          <Button
            key={item.attributes!.activity as string}
            variant="primary"
            size="sm"
            onClick={() => {
              if (!slotForm.doc!.data!.links) {
                slotForm.doc!.data!.links = {} satisfies LinksObject;
              }
              slotForm.doc!.data!.links!.self = apiPath(
                `/project/${props.projectId}/slot/${item.id}`,
              );
              slotForm.setValue("id", item.id);
              slotForm.setValue("end", new Date().toISOString());
              slotForm.handleSubmit(
                new Event("submit", {
                  cancelable: true,
                  bubbles: true,
                }) as unknown as FormEvent,
              );
            }}
          >
            <span className="text-nowrap">
              <FontAwesomeIcon icon={faPause} />
              &nbsp;{capitalize(item.attributes!.activity as string)}
              <span className="text-danger">
                <FontAwesomeIcon
                  icon={faCircle}
                  fontVariant="danger"
                  beatFade
                  className="ms-1"
                />
              </span>
            </span>
          </Button>
        ))}
      </div>
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { projectId: _, ...buttonProps } = props;
  return (
    <Dropdown>
      <Dropdown.Toggle {...buttonProps}>
        <FontAwesomeIcon icon={faPlay} title="Start tracking"></FontAwesomeIcon>
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {activities &&
          activities.doc &&
          activities.doc.data &&
          activities.doc.data.map((item) => (
            <Dropdown.Item
              key={item.id}
              onClick={() => {
                slotForm.setValue("activity", item.id);
                slotForm.handleSubmit(
                  new Event("submit", {
                    cancelable: true,
                    bubbles: true,
                  }) as unknown as FormEvent,
                );
              }}
            >
              {capitalize(item.attributes!.value as string)}
            </Dropdown.Item>
          ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};
