import { FormControl, InputGroup } from "react-bootstrap";
import { fas, IconName } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import {
  LabeledGroup,
  LabeledGroupPropsWithOnChange,
} from "@vloryan/boot-api-ts/components/fields";

const icons = Object.keys(fas).map(
  (key) => camelCaseToKebap(key.slice(2)) as IconName,
);

export const IconPickerField = ({
  defaultValue,
  onChange,
  ...props
}: LabeledGroupPropsWithOnChange) => {
  const [icon, setIcon] = useState(defaultValue as IconName | undefined);
  const [invalid, setInvalid] = useState<boolean>(
    icons.indexOf(defaultValue as IconName) === -1,
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { as, children, ...controlProps } = props;
  return (
    <LabeledGroup {...props}>
      <InputGroup>
        <FormControl
          name="icon"
          defaultValue={icon}
          isInvalid={invalid}
          onChange={(event) => {
            const value = (event.currentTarget as HTMLInputElement).value;
            if (icons.indexOf(value as IconName) != -1) {
              setIcon(value as IconName);
              setInvalid(false);
              if (onChange) {
                onChange(event);
              }
            } else {
              setIcon(undefined);
              setInvalid(true);
            }
          }}
          {...controlProps}
        />
        <InputGroup.Text>
          {icon ? (
            <FontAwesomeIcon icon={["fas", icon as IconName]} />
          ) : (
            <FontAwesomeIcon
              icon={["fas", "bomb" as IconName]}
              title="Unknown"
              fade
            />
          )}
        </InputGroup.Text>
      </InputGroup>
    </LabeledGroup>
  );
};

function camelCaseToKebap(s: string) {
  const words = s.charAt(0) + s.slice(1).replace(/([A-Z])([^A-Z ])/g, "-$1$2");
  return words.toLowerCase();
}
