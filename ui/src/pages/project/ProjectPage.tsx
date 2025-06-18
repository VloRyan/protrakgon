import { Link, useLocation } from "wouter";
import { ProjectEditor } from "../../components/project/ProjectEditor.tsx";
import { ItemPage } from "../../components/ItemPage.tsx";

import { Card, Col, Row } from "react-bootstrap";
import { TypeIcon } from "../../components/TypeIcon.tsx";
import { capitalize, padLeft } from "../../functions/strings.ts";
import {
  formatDateString,
  isSameDayString,
  toLocaleDateString,
} from "../../functions/date.ts";
import { ItemActionCol } from "../../components/ItemRow.tsx";
import { ItemList } from "../../components/ItemList.tsx";
import { SERVER_API_PATH } from "../../Config.ts";
import { CreateButton } from "../../components/Buttons.tsx";
import { joinPath } from "../../functions/url.ts";
import { useAlertSubmitResponseHandler } from "../../hooks/UseAlert.ts";
import { useResource } from "../../hooks/UseResource.ts";
import { useResourceObjectForm } from "../../hooks/UseResourceObjectForm.ts";

export function ProjectPage() {
  const [location] = useLocation();
  const submitResponseHandler = useAlertSubmitResponseHandler();
  const { doc, isLoading, error, queryKey } = useResource(
    joinPath(SERVER_API_PATH, "/v1/", location),
  );
  const form = useResourceObjectForm({
    id: "projectForm",
    object: doc && doc.data ? doc.data : null,
    queryKey: queryKey,
    submitUrlPrefix: SERVER_API_PATH,
    submitResponseHandler: submitResponseHandler,
  });
  const dateTimeFormat = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  } satisfies Intl.DateTimeFormatOptions;
  return (
    <ItemPage error={error} isLoading={isLoading} formId={form.id}>
      <form {...form.setup()}>
        <ProjectEditor form={form} />
      </form>
      <Card className="mt-2 mx-3">
        <Card.Title className="text-center">
          <Row className="pt-2">
            <Col className="d-flex justify-content-center">
              Slots
              <Link to={location + "/slot/new"} className="ms-2">
                <CreateButton size="sm" />
              </Link>
            </Col>
          </Row>
        </Card.Title>
        <Card.Body>
          <ItemList
            url={joinPath(SERVER_API_PATH, "/v1/", location, "/slot")}
            opts={{ sort: "-start" }}
            itemCellsFunc={(obj, _includes, queryKey) => {
              const isOpen =
                new Date(obj.attributes!.end as string).getDate() == 1;
              const timeDiff =
                !isOpen && obj.attributes!.end
                  ? new Date(obj.attributes!.end as string).getTime() -
                    new Date(obj.attributes!.start as string).getTime()
                  : 0;
              return (
                <>
                  <Col sm={2}>
                    <Link to={location + `/slot/${obj.id}`}>
                      <TypeIcon
                        type={obj.type as string}
                        className="me-1"
                      ></TypeIcon>
                      {obj.attributes && obj.attributes.activity !== undefined
                        ? capitalize(obj.attributes.activity as string)
                        : obj.id}
                    </Link>
                  </Col>
                  <Col className="font-monospace d-flex justify-content-end">
                    {formatDateString(
                      obj.attributes!.start! as string,
                      dateTimeFormat,
                    )}
                    {obj.attributes!.end && !isOpen
                      ? " - " +
                        (isSameDayString(
                          obj.attributes!.start as string,
                          obj.attributes!.end as string,
                        )
                          ? formatTime(obj.attributes!.end! as string)
                          : formatTime(obj.attributes!.end! as string) +
                            " (" +
                            toLocaleDateString(obj.attributes!.end! as string) +
                            ")")
                      : null}
                  </Col>
                  <Col sm={2} className="font-monospace justify-content-end">
                    {timeDiff > 0 ? formatDiff(timeDiff) : null}
                  </Col>
                  <ItemActionCol object={obj} queryKey={queryKey} />
                </>
              );
            }}
          />
        </Card.Body>
      </Card>
    </ItemPage>
  );
}

function formatTime(s: string) {
  const d = new Date(s);
  return d.toTimeString().slice(0, 5);
}

function formatDiff(diff: number) {
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return `${padLeft(hours, 2, " ")}h ${padLeft(minutes, 2, "0")}m`;
}
