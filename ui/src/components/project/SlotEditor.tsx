import { Container, Row } from "react-bootstrap";
import { ObjectForm } from "ts-jsonapi-form/form/ObjectForm.ts";
import { useEffect } from "react";
import { useAlert } from "../../hooks/UseAlert.ts";
import { capitalize } from "../../functions/strings.ts";
import { SERVER_API_PATH } from "../../Config.ts";
import { BootstrapFieldFactory } from "../fields/FieldFactory.tsx";
import { joinPath } from "../../functions/url.ts";
import { useResources } from "../../hooks/UseResource.ts";

export const SlotEditor = ({ form }: { form: ObjectForm }) => {
  const { addApiErrorAlerts, clearAlerts } = useAlert();
  useEffect(() => {
    clearAlerts();
  }, []);
  const activities = useResources(
    joinPath(SERVER_API_PATH, "/v1/project/activity"),
  );
  useEffect(() => {
    if (activities.error) {
      addApiErrorAlerts(activities.error);
    }
  }, [activities.error]);
  const activityTypes = new Map<string, string>();
  if (
    !activities.error &&
    !activities.isLoading &&
    activities.doc &&
    activities.doc.data
  ) {
    activities.doc.data.forEach((doc) => {
      activityTypes.set(doc.id, capitalize(doc.id));
    });
  }
  const fields = new BootstrapFieldFactory(form);
  return (
    <Container fluid>
      <Row>
        <fields.Select
          label="Activity"
          name="activity"
          options={activityTypes}
        />
        <fields.DateTime label="Start" name="start" />
        <fields.DateTime label="End" name="end" />
      </Row>
      <Row>
        <fields.TextArea label="Description" name="description" rows={5} />
      </Row>
    </Container>
  );
};
