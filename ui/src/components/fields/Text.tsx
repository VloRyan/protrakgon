import { Form, InputGroup } from "react-bootstrap";

import React, { ReactNode } from "react";
import { LabeledFormFieldPropsWithOnChange, LabeledGroup } from "./Label.tsx";

export interface TextFieldProps
  extends LabeledFormFieldPropsWithOnChange<string> {
  children?: ReactNode;
  placeholder?: string;
  error?: string;
}

export function TextField({
  name,
  defaultValue,
  label,
  md,
  onChange,
  children,
  disabled,
  placeholder,
  error,
}: TextFieldProps) {
  return (
    <LabeledGroup label={label} md={md}>
      <InputGroup>
        <Form.Control
          type="text"
          name={name}
          defaultValue={defaultValue}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          isInvalid={error != undefined}
        ></Form.Control>
        {children}
        {error ? (
          <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
        ) : null}
      </InputGroup>
    </LabeledGroup>
  );
}

export interface TextAreaProps
  extends LabeledFormFieldPropsWithOnChange<string> {
  rows?: number;
  mapValue?: (value: string) => string;
  placeholder?: string;
}

export const TextAreaField = React.forwardRef<
  HTMLTextAreaElement,
  TextAreaProps
>((props, ref) => {
  let v = typeof props.defaultValue === "string" ? props.defaultValue : "";
  if (props.mapValue) {
    v = props.mapValue(v);
  }
  return (
    <LabeledGroup label={props.label} md={props.md}>
      <Form.Control
        as="textarea"
        rows={props.rows}
        name={props.name}
        defaultValue={v}
        ref={ref}
        onChange={props.onChange}
        placeholder={props.placeholder}
        onKeyDown={(event) =>
          event.key == "Enter" ? event.stopPropagation() : null
        }
      ></Form.Control>
    </LabeledGroup>
  );
});
