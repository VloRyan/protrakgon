import { Container, Row } from "react-bootstrap";
import { ObjectForm } from "ts-jsonapi-form/form/ObjectForm.ts";
import { BootstrapFieldFactory } from "../fields/FieldFactory.tsx";

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
