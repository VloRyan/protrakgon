import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faFloppyDisk,
  faPen,
  faPlus,
  faTrashAlt,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "react-bootstrap";
import { ButtonProps } from "react-bootstrap/Button";

import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { PropsWithChildren } from "react";
import { Link } from "wouter";
import { ButtonVariant } from "react-bootstrap/types";

export function DeleteButton(props: ButtonProps) {
  return (
    <IconButton
      icon={faTrashAlt}
      title="Delete"
      variant="outline-danger"
      {...props}
    ></IconButton>
  );
}

export function CreateButton(props: ButtonProps) {
  return (
    <IconButton
      name="create"
      icon={faPlus}
      title="Create"
      type="button"
      variant="outline-primary"
      {...props}
    ></IconButton>
  );
}

export function SaveButton(props: ButtonProps) {
  return (
    <IconButton
      name="save"
      icon={faFloppyDisk}
      title="Save"
      variant="outline-primary"
      type={props.form ? "submit" : "button"}
      {...props}
    ></IconButton>
  );
}

interface IconButtonProps extends ButtonProps {
  icon: IconProp;
}

export function IconButton(props: PropsWithChildren<IconButtonProps>) {
  return (
    <Button {...props}>
      <FontAwesomeIcon icon={props.icon} title={props.title}></FontAwesomeIcon>
      {props.children}
    </Button>
  );
}
export interface LinkButtonProps extends ButtonProps {
  href: string;
  className?: string;
  variant?: ButtonVariant;
  size?: "sm" | "lg";
}

export const LinkButton = (props: LinkButtonProps) => {
  return (
    <Link
      title="Open in new tab"
      target="_blank"
      rel="noopener noreferrer"
      className={
        "btn btn-primary" +
        asBtnClassName(props.size) +
        asBtnClassName(props.variant) +
        " " +
        props.className
      }
      to={props.href}
    >
      <FontAwesomeIcon icon={faArrowUpRightFromSquare}></FontAwesomeIcon>
    </Link>
  );
};

export const EditItemButton = (props: LinkButtonProps) => {
  return (
    <Link
      title="Edit item"
      className={
        "btn btn-outline-primary" +
        asBtnClassName(props.size) +
        asBtnClassName(props.variant) +
        " " +
        props.className
      }
      to={props.href}
    >
      <FontAwesomeIcon icon={faPen}></FontAwesomeIcon>
    </Link>
  );
};
function asBtnClassName(prop: string | undefined) {
  return prop ? " btn-" + prop : "";
}
