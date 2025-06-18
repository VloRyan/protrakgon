import { useEffect } from "react";
import { Alert } from "react-bootstrap";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Variant } from "react-bootstrap/types";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

export class AlertData {
  title?: string;
  detail?: string;
  variant?: Variant;
  icon?: IconProp;
  timeout? = 0;
  handleDismiss?: () => void = undefined;

  constructor(title: string = "", detail: string = "") {
    this.title = title;
    this.detail = detail;
    this.icon = faTriangleExclamation;
  }
}

export function CloseableAlert({
  title,
  detail,
  variant,
  icon,
  timeout,
  handleDismiss,
}: AlertData) {
  useEffect(() => {
    if (timeout && timeout > 0 && handleDismiss) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, timeout);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <Alert
      className="align-items-center fade show"
      role="alert"
      variant={variant}
      onClose={handleDismiss}
      dismissible
    >
      <h4 className="alert-heading">
        {icon && <FontAwesomeIcon icon={icon} className="me-2" />}
        {title}
      </h4>
      <div>{detail}</div>
      <button
        type="button"
        className="btn-close"
        onClick={handleDismiss}
        aria-label="Close"
      ></button>
    </Alert>
  );
}
