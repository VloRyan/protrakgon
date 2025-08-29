import { Container, Row } from "react-bootstrap";
import { ObjectForm } from "@vloryan/ts-jsonapi-form/form/";

import { FieldFactory } from "../fields/FieldFactory.tsx";
export const ActivityEditor = ({ form }: { form: ObjectForm }) => {
  const fields = new FieldFactory(form);
  return (
    <Container fluid>
      <Row>
        <fields.Text label="Name" name="name" />
        <fields.IconPicker label="Icon" name="icon" />
      </Row>
      <Row>
        <fields.CheckBox label="Billable" name="billable" />
        <fields.Number label="Amount" name="amount" />
      </Row>
      <Row>
        <fields.TextArea label="Description" name="description" rows={5} />
      </Row>
    </Container>
  );
};
