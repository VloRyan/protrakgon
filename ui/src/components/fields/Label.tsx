import { Col, Form } from "react-bootstrap";

import { ChangeEvent, JSX, ReactNode } from "react";
import { FormControlElement } from "./FieldFactory.tsx";

export function LabeledGroup({
  label,
  md,
  children,
  className,
}: {
  label?: string;
  md?: string;
  children?: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <Form.Group as={Col} md={md} className={className}>
      {label ? <Form.Label column="sm">{label}</Form.Label> : null}
      {children}
    </Form.Group>
  );
}

interface LabeledFormFieldProps<T> {
  name: string;
  defaultValue?: T;
  label?: string;
  md?: string;
}

export interface LabeledFormFieldPropsWithOnChange<T>
  extends LabeledFormFieldProps<T> {
  onChange?: (e: ChangeEvent<FormControlElement>) => void;
  disabled?: boolean;
}
