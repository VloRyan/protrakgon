import { Button, Dropdown } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { ButtonProps } from "react-bootstrap/Button";

import { LoadingSpinner } from "../LoadingSpinner.tsx";
import { useAlert } from "../../hooks/UseAlert.ts";

import { useEffect, useRef } from "react";
import { capitalize } from "../../functions/strings.ts";
import { SERVER_API_PATH } from "../../Config.ts";
import { joinPath } from "../../functions/url.ts";
import { useResources } from "../../hooks/UseResource.ts";
import { useResourceObjectForm } from "../../hooks/UseResourceObjectForm.ts";

export interface TrackingButtonProps extends ButtonProps {
  projectId: string;
}
export const TrackingButton = (props: TrackingButtonProps) => {
  const { addApiErrorAlerts, clearAlerts } = useAlert();
  useEffect(() => {
    clearAlerts();
  }, []);
  const openSlots = useResources(
    joinPath(SERVER_API_PATH, `/v1/project/${props.projectId}/slot`),
    {
      filter: { isOpen: true },
    },
  );
  const activities = useResources(
    joinPath(SERVER_API_PATH, "/v1/project/activity"),
  );
  useEffect(() => {
    if (openSlots.error || activities.error) {
      addApiErrorAlerts(openSlots.error ? openSlots.error : activities.error!);
    }
  }, [openSlots.error, activities.error]);
  const formRef = useRef<HTMLFormElement>(null);
  const slotForm = useResourceObjectForm({
    object: {
      id: "",
      type: "slot",
      attributes: { projectId: +props.projectId },
      meta: {},
      links: { self: `/v1/project/${props.projectId}/slot` },
    },
    queryKey: openSlots.queryKey,
    submitUrlPrefix: SERVER_API_PATH,
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
              slotForm.object!.links = {
                self: `/v1/project/${props.projectId}/slot/${item.id}`,
              };
              slotForm.setValue("id", item.id);
              slotForm.setValue("end", new Date());
              formRef.current!.dispatchEvent(
                new Event("submit", { cancelable: true, bubbles: true }),
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
        <form ref={formRef} {...slotForm.setup()} />
      </div>
    );
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { projectId: _, ...buttonProps } = props;
    return (
      <Dropdown>
        <Dropdown.Toggle {...buttonProps}>
          <FontAwesomeIcon
            icon={faPlay}
            title="Start tracking"
          ></FontAwesomeIcon>
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
                  formRef.current!.dispatchEvent(
                    new Event("submit", { cancelable: true, bubbles: true }),
                  );
                }}
              >
                {capitalize(item.attributes!.value as string)}
              </Dropdown.Item>
            ))}
        </Dropdown.Menu>
        <form ref={formRef} {...slotForm.setup()} />
      </Dropdown>
    );
  }
};
