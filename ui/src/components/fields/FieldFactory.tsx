import { BootstrapFieldFactory } from "@vloryan/boot-api-ts/components/fields/";
import { IconPickerField } from "./IconPickerField.tsx";
import { LabeledGroupPropsWithOnChange } from "@vloryan/boot-api-ts/components/fields";

export class FieldFactory extends BootstrapFieldFactory {
  IconPicker = (props: LabeledGroupPropsWithOnChange) => {
    return <IconPickerField {...props} {...this.setupField(props.name)} />;
  };
}
