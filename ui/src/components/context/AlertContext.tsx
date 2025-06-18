import { createContext, PropsWithChildren, useState } from "react";
import { CloseableAlert } from "../Alert.tsx";

export interface Alert {
  title: string;
  detail?: string;
  variant: string;
  timeout?: number;
}

interface AlertEntity extends Alert {
  id: string;
}

export type AlertContextType = {
  alerts: AlertEntity[];
  addAlert: (alert: Alert) => string;
  dismissAlert: (id: string) => void;
};
export const AlertContext = createContext<AlertContextType>({
  alerts: [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addAlert: (_alert: Alert) => {
    return "";
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  dismissAlert: (_id: string) => {},
});

export const AlertProvider = ({ children }: PropsWithChildren) => {
  const [alerts, setAlerts] = useState<AlertEntity[]>([]);

  const addAlert = (alert: Alert) => {
    if (alerts.length > 4) {
      // TODO infinite recursion
      return "";
    }
    const id =
      Math.random().toString(36).slice(2, 9) +
      new Date().getTime().toString(36);

    setAlerts((prev) => [{ ...alert, id: id }, ...prev]);
    return id;
  };

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  return (
    <AlertContext.Provider
      value={{
        alerts: alerts,
        addAlert: addAlert,
        dismissAlert: dismissAlert,
      }}
    >
      <AlertsWrapper>
        {alerts.map((alert) => (
          <CloseableAlert
            key={alert.id}
            variant={alert.variant}
            title={alert.title}
            detail={alert.detail}
            timeout={alert.timeout}
            handleDismiss={() => dismissAlert(alert.id)}
          ></CloseableAlert>
        ))}
      </AlertsWrapper>
      {children}
    </AlertContext.Provider>
  );
};
const AlertsWrapper = ({ children }: PropsWithChildren) => {
  return (
    <div className="position-absolute top-0 start-50 translate-middle-x z-3 pointer-events-none max-w-sm min-w-fit w-full">
      <div className="pt-2">{children}</div>
    </div>
  );
};
