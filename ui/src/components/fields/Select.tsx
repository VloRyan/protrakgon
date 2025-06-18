import { Form } from "react-bootstrap";

import { LabeledFormFieldPropsWithOnChange, LabeledGroup } from "./Label.tsx";

interface SelectFieldProps extends LabeledFormFieldPropsWithOnChange<string> {
  options: Map<string, string | null>;
}

export function SelectField({
  name,
  defaultValue,
  label,
  md,
  onChange,
  options,
  disabled,
}: SelectFieldProps) {
  const optionElements = [];

  for (const [value, caption] of options) {
    optionElements.push(
      <option key={value} value={value} selected={value === defaultValue}>
        {caption}
      </option>,
    );
  }
  return (
    <LabeledGroup label={label} md={md}>
      <Form.Select
        name={name}
        onChange={onChange}
        defaultValue={defaultValue}
        disabled={disabled}
      >
        {optionElements}
      </Form.Select>
    </LabeledGroup>
  );
}
