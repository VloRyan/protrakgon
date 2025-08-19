import { Container, Row } from "react-bootstrap";
import { ObjectForm } from "@vloryan/ts-jsonapi-form/form/";
import { useEffect } from "react";
import { useAlert, useResources } from "@vloryan/boot-api-ts/hooks/";
import { capitalize } from "@vloryan/boot-api-ts/functions/";
import { BootstrapFieldFactory } from "@vloryan/boot-api-ts/components/fields/";
import { apiPath } from "../../functions/url.ts";
import { useLocation } from "wouter";

export const SlotEditor = ({ form }: { form: ObjectForm }) => {
  const { addApiErrorAlerts, clearAlerts } = useAlert();
  const [location] = useLocation();
  useEffect(() => {
    clearAlerts();
  }, []);
  const activities = useResources(apiPath(location, "/project/activity"));
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
