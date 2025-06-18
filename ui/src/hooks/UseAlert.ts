import { useContext, useRef, useState } from "react";
import { Alert, AlertContext } from "../components/context/AlertContext.tsx";
import { ApiError } from "ts-jsonapi-form/jsonapi/model/ApiError.ts";
import { useLocation } from "wouter";
import { ResourceObject } from "ts-jsonapi-form/jsonapi/model/Objects.ts";

const ALERT_FADE_TIME_SUCCESS = 1000;
const ALERT_FADE_TIME = 5000;
export const useAlert = () => {
  const [alertIds, setAlertIds] = useState<string[]>([]);
  const alertIdsRef = useRef(alertIds);
  const { addAlert, dismissAlert } = useContext(AlertContext);

  const addAlertWithId = (alert: Alert) => {
    const id = addAlert(alert);
    alertIdsRef.current.push(id);
    setAlertIds(alertIdsRef.current);
  };

  const addErrorAlert = (title: string, detail: string | undefined) => {
    addAlert({ variant: "danger", title, detail, timeout: ALERT_FADE_TIME });
  };
  const addSuccessAlert = (title: string, detail?: string | undefined) => {
    addAlert({
      variant: "success",
      title,
      detail,
      timeout: ALERT_FADE_TIME_SUCCESS,
    } satisfies Alert);
  };

  const addApiErrorAlerts = (error: Error) => {
    const apiError = error as ApiError;
    if (apiError.errors !== undefined) {
      apiError.errors.forEach((e) => {
        addErrorAlert(e.title || "", e.detail);
      });
    } else {
      addErrorAlert("Error occurred", error.message);
    }
  };

  const clearAlerts = () => {
    alertIdsRef.current.forEach((id) => dismissAlert(id));
    alertIdsRef.current = [];
    setAlertIds([]);
  };
  return {
    addAlert: addAlertWithId,
    addErrorAlert: addErrorAlert,
    addSuccessAlert: addSuccessAlert,
    addApiErrorAlerts: addApiErrorAlerts,
    clearAlerts,
  };
};

export const useAlertSubmitResponseHandler = () => {
  const [location, setLocation] = useLocation();
  const { addSuccessAlert, addApiErrorAlerts } = useAlert();

  return {
    onSubmitSuccess: function (object: ResourceObject): void {
      if (location.endsWith("/new")) {
        if (!object || !object.links || !object.links.self) {
          throw new Error("No self link defined");
        }
        setLocation(location.replace("/new", `/${object.id}`), {
          replace: true,
        });
      }
      addSuccessAlert("Saved successful");
    },
    onSubmitError: function (error: Error): void {
      addApiErrorAlerts(error);
    },
  };
};
