import { Form } from "react-bootstrap";

import { JSX } from "react";

import { LabeledFormFieldPropsWithOnChange, LabeledGroup } from "./Label.tsx";

export function DateField({
  name,
  defaultValue,
  label,
  md,
  onChange,
}: LabeledFormFieldPropsWithOnChange<string>): JSX.Element {
  const value = defaultValue ? new Date(defaultValue) : undefined;
  return (
    <LabeledGroup label={label} md={md}>
      <Form.Control
        name={name}
        type="date"
        defaultValue={value ? value.toISOString().substring(0, 10) : ""}
        onChange={(event) => {
          const target = event.currentTarget as HTMLInputElement;
          const newEvent = {
            ...event,
            currentTarget: {
              ...target,
              name: target.name,
              type: target.type,
              value: target.value + "T00:00:00Z",
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
