import { Container, Row } from "react-bootstrap";
import { ObjectForm } from "@vloryan/ts-jsonapi-form/form/";
import { useEffect } from "react";
import { useAlert, useResources } from "@vloryan/boot-api-ts/hooks/";
import { capitalize } from "@vloryan/boot-api-ts/functions/";
import { BootstrapFieldFactory } from "@vloryan/boot-api-ts/components/fields/";
import { apiPath } from "../../functions/url.ts";
import { ObjectLike } from "@vloryan/ts-jsonapi-form/jsonapi/model/";

export const SlotEditor = ({ form }: { form: ObjectForm }) => {
  const { addApiErrorAlerts, clearAlerts } = useAlert();
  useEffect(() => {
    clearAlerts();
  }, []);
  const activities = useResources(
    apiPath(`/project/${form.getValue("project.id")}/activity`),
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
    activities.doc.data.forEach((activity) => {
      activityTypes.set(
        activity.id,

        capitalize(activity.attributes!.name as string),
      );
    });
    if (form.getValue("activity") === undefined) {
      form.setValue(
        "activity",
        activities.doc.data[0] as unknown as ObjectLike,
      );
    }
  }
  const fields = new BootstrapFieldFactory(form);
  return (
    <Container fluid>
      <Row>
        <fields.Select
          label="Activity"
          name="activity.id"
          options={activityTypes}
          style={{ fontFamily: "'FontAwesome', 'sans-serif'" }}
        />
        <fields.DateTime label="Start" name="start" required />
        <fields.DateTime label="End" name="end" />
      </Row>
      <Row>
        <fields.TextArea label="Description" name="description" rows={5} />
      </Row>
    </Container>
  );
};
