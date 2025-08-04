import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBomb } from "@fortawesome/free-solid-svg-icons";
import { resolveIcon } from "../Icons.ts";

interface TypeIconProps {
  type: string;
  className?: string;
  title?: string;
}

export function TypeIcon(props: TypeIconProps) {
  const icon = resolveIcon(props.type);
  if (icon === undefined) {
    return <FontAwesomeIcon icon={faBomb} title="unknown"></FontAwesomeIcon>;
  }
  return (
    <FontAwesomeIcon
      icon={icon}
      title={props.title ? props.title : props.type}
      className={props.className}
    ></FontAwesomeIcon>
  );
}
