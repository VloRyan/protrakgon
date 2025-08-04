import { Form } from "react-bootstrap";

import { JSX, useState } from "react";

import { LabeledFormFieldPropsWithOnChange, LabeledGroup } from "./Label.tsx";

export function DateField({
  name,
  defaultValue,
  label,
  md,
  onChange,
  required,
}: LabeledFormFieldPropsWithOnChange<string>): JSX.Element {
  const [invalid, setInvalid] = useState(false);
  const value = defaultValue ? new Date(defaultValue) : undefined;
  return (
    <LabeledGroup label={label} md={md}>
      <Form.Control
        name={name}
        required={required}
        type="date"
        isInvalid={invalid}
        defaultValue={value ? value.toISOString().substring(0, 10) : undefined}
        onChange={(event) => {
          const target = event.currentTarget as HTMLInputElement;
          if (required) {
            setInvalid(!target.value);
          }
          const newEvent = {
            ...event,
            currentTarget: {
              ...target,
              name: target.name,
              type: target.type,
              value: target.value ? target.value : "",
            },
          };
          if (onChange) {
            onChange(newEvent);
          }
        }}
      ></Form.Control>
    </LabeledGroup>
  );
}

export function DateTimeField({
  name,
  defaultValue,
  label,
  md,
  onChange,
}: LabeledFormFieldPropsWithOnChange<string>): JSX.Element {
  const value = defaultValue ? new Date(defaultValue) : undefined;
  const dateTimeLocalValue = value
    ? new Date(value!.getTime() - value!.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, -1)
        .substring(0, 16)
    : "";
  return (
    <LabeledGroup label={label} md={md}>
      <Form.Control
        name={name}
        type="datetime-local"
        defaultValue={dateTimeLocalValue}
        onChange={(event) => {
          const target = event.currentTarget as HTMLInputElement;
          const newEvent = {
            ...event,
            currentTarget: {
              ...target,
              name: target.name,
              type: target.type,
              value: new Date(target.value).toISOString(),
            },
          };
          if (onChange) {
            onChange(newEvent);
          }
        }}
      ></Form.Control>
    </LabeledGroup>
  );
}
