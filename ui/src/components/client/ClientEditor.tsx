import { Container, Row } from "react-bootstrap";
import { ObjectForm } from "@vloryan/ts-jsonapi-form/form/";
import { BootstrapFieldFactory } from "@vloryan/boot-api-ts/components/fields/";

export const ClientEditor = ({ form }: { form: ObjectForm }) => {
  const fields = new BootstrapFieldFactory(form);
  return (
    <Container fluid>
      <Row>
        <fields.Text label="Name" name="name" />
        <fields.Text label="Description" name="description" />
      </Row>
    </Container>
  );
};
