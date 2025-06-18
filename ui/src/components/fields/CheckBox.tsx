import { Form } from "react-bootstrap";

import { JSX } from "react";
import { LabeledFormFieldPropsWithOnChange, LabeledGroup } from "./Label.tsx";

export function CheckboxField({
  name,
  defaultValue,
  label,
  md,
  onChange,
}: LabeledFormFieldPropsWithOnChange<boolean>): JSX.Element {
  return (
    <LabeledGroup label={label} md={md}>
      <Form.Check
        type="switch"
        name={name}
        defaultChecked={defaultValue}
        onChange={onChange}
      ></Form.Check>
    </LabeledGroup>
  );
}
