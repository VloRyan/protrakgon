import { Container, Row } from "react-bootstrap";
import { ObjectForm } from "ts-jsonapi-form/form/ObjectForm.ts";
import { BootstrapFieldFactory } from "../fields/FieldFactory.tsx";
import { joinPath } from "../../functions/url.ts";
import { SERVER_API_PATH } from "../../Config.ts";

export const ProjectEditor = ({ form }: { form: ObjectForm }) => {
  const fields = new BootstrapFieldFactory(form);
  return (
    <Container fluid>
      <Row>
        <fields.Text label="Name" name="name" />
        <fields.Text label="Description" name="description" />
      </Row>
      <Row>
        <fields.Lookup
          label="Client"
          name="client"
          url={joinPath(SERVER_API_PATH, "/v1/client")}
        />
      </Row>
    </Container>
  );
};
