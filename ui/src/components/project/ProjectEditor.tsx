import { Container, Row } from "react-bootstrap";
import { ObjectForm } from "@vloryan/ts-jsonapi-form/form/";
import { BootstrapFieldFactory } from "@vloryan/boot-api-ts/components/fields/";
import { apiPath } from "../../functions/url.ts";

export const ProjectEditor = ({ form }: { form: ObjectForm }) => {
  const fields = new BootstrapFieldFactory(form);
  return (
    <Container fluid>
      <Row>
        <fields.Text label="Name" name="name" />
        <fields.Text label="Description" name="description" />
      </Row>
      <Row>
        <fields.Lookup label="Client" name="client" url={apiPath("/client")} />
      </Row>
    </Container>
  );
};
