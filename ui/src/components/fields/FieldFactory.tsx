import { ObjectForm } from "ts-jsonapi-form/form/ObjectForm.ts";
import { ChangeEvent, JSX, useEffect, useState } from "react";
import { CheckboxField } from "./CheckBox.tsx";
import { LabeledGroup } from "./Label.tsx";
import { TextAreaField, TextAreaProps, TextField } from "./Text.tsx";
import { DateField, DateTimeField } from "./Date.tsx";
import { NumberField } from "./Number.tsx";
import { SelectField } from "./Select.tsx";
import {
  ResourceIdentifierObject,
  ResourceObject,
} from "ts-jsonapi-form/jsonapi/model/Objects.ts";
import { fetchResource } from "ts-jsonapi-form/jsonapi/JsonApi.ts";
import { SingleResourceDoc } from "ts-jsonapi-form/jsonapi/model/Document.ts";
import { LoadingSpinner } from "../LoadingSpinner.tsx";
import { ResourceObjectLookupField } from "./ResourceObjectLookup.tsx";

export type FormControlElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement;

export interface FieldColProps {
  name: string;
  label?: string;
  md?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  // onChange?: (e: ChangeEvent<FormControlElement>) => void;
}
export interface TypeSelectFieldColProps extends FieldColProps {
  type: string;
  withEmptyOption?: boolean;
  multiple?: boolean;
}
export interface SelectFieldColProps extends FieldColProps {
  options: Map<string, string | null>;
  onChange?: (e: ChangeEvent<FormControlElement>) => void;
}
export interface LookupFieldColProps extends FieldColProps {
  url: string;
  onSelectionChange?: (e: ResourceObject | null) => void;
}
export interface NumberFieldColProps extends FieldColProps {
  step?: number | string | undefined;
}

export interface FieldFactory {
  Text(props: FieldColProps): JSX.Element;
  TextArea(props: FieldColProps): JSX.Element;
  Number(props: NumberFieldColProps): JSX.Element;
  Date(props: FieldColProps): JSX.Element;
  DateTime(props: FieldColProps): JSX.Element;
  Select(props: SelectFieldColProps): JSX.Element;
  CheckBox(props: FieldColProps): JSX.Element;
  Lookup(props: LookupFieldColProps): JSX.Element;
}

export class BootstrapFieldFactory implements FieldFactory {
  private form: ObjectForm;
  constructor(form: ObjectForm) {
    this.form = form;
  }
  Text = (props: FieldColProps): JSX.Element => {
    return <TextField {...props} {...this.registerField(props.name)} />;
  };

  TextArea = (props: TextAreaProps): JSX.Element => {
    return <TextAreaField {...props} {...this.registerField(props.name)} />;
  };

  CheckBox = (props: FieldColProps): JSX.Element => {
    return <CheckboxField {...props} {...this.registerField(props.name)} />;
  };

  Date = (props: FieldColProps): JSX.Element => {
    return <DateField {...props} {...this.registerField(props.name)} />;
  };

  DateTime = (props: FieldColProps): JSX.Element => {
    return <DateTimeField {...props} {...this.registerField(props.name)} />;
  };

  Number = (props: NumberFieldColProps): JSX.Element => {
    return <NumberField {...props} {...this.registerField(props.name)} />;
  };

  Select = (props: SelectFieldColProps): JSX.Element => {
    const fieldProps = this.registerField<string>(props.name);
    if (props.onChange) {
      const origOnChange = props.onChange;
      props = {
        ...props,
        name: fieldProps.name,
        onChange: (e) => {
          fieldProps.onChange(e);
          origOnChange(e);
        },
      } satisfies SelectFieldColProps;
    } else {
      props = {
        ...props,
        ...fieldProps,
      } satisfies SelectFieldColProps;
    }
    return <SelectField {...props} defaultValue={fieldProps.defaultValue} />;
  };

  Lookup = (props: LookupFieldColProps) => {
    const path = "relationships." + props.name;
    let dataPath = path + ".data";
    const arrStart = props.name.indexOf("[");
    if (arrStart !== -1) {
      const elemIdx = props.name.substring(
        arrStart + 1,
        props.name.indexOf("]"),
      );
      dataPath =
        "relationships." +
        props.name.substring(0, arrStart) +
        `.data[${elemIdx}]`;
    }
    let id: string | undefined = undefined;
    const resIdObj = this.form.getValue(dataPath) as ResourceIdentifierObject;
    if (resIdObj) {
      id = resIdObj.id;
    }
    const [obj, setObj] = useState<ResourceObject | null>(null);
    useEffect(() => {
      fetchObject().then((fetched) => setObj(fetched ?? null));
    }, [id]);
    const fetchObject = async () => {
      try {
        if (!id) {
          return undefined;
        }
        const doc = (await fetchResource(
          props.url + "/" + id,
        )) as SingleResourceDoc;
        return doc.data;
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    return (
      <LabeledGroup label={props.label} md={props.md}>
        {id && !obj ? (
          <LoadingSpinner />
        ) : (
          <ResourceObjectLookupField
            name={props.name}
            url={props.url}
            defaultValue={obj}
            onSelectionChange={(selected) => {
              setObj(() => {
                let newValue: ResourceIdentifierObject | null = null;
                if (selected) {
                  newValue = {
                    id: selected.id,
                    type: selected.type,
                  };
                }
                this.form.setValue(dataPath, newValue);
                if (props.onSelectionChange) {
                  props.onSelectionChange(selected);
                }
                return selected;
              });
            }}
          />
        )}
      </LabeledGroup>
    );
  };

  protected registerField<T>(name: string): {
    name: string;
    onChange: React.ChangeEventHandler<FormControlElement>;
    defaultValue: T;
  } {
    let path = name;
    if (path != "id" && path != "type") {
      path = "attributes." + path;
    }
    let value = this.form.getValue(path);
    const typesToCheck = ["string", "number", "boolean"];
    if (!typesToCheck.includes(typeof value)) {
      value = "";
    }
    return {
      name: name,
      onChange: this.form.handleChange,
      defaultValue: value,
    };
  }
}
