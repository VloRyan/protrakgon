import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../assets/icon.svg";
import { useEffect } from "react";
import {
  faBriefcase,
  faClock,
  faDiagramProject,
  faListUl,
  faMugHot,
  faPeopleGroup,
  faPerson,
} from "@fortawesome/free-solid-svg-icons";

import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Routes } from "./Routes.tsx";
import { Route, Router, Switch } from "wouter";
import { AlertProvider } from "@vloryan/boot-api-ts/components/context/";
import { Config as BootApiTsConfig } from "@vloryan/boot-api-ts/Config.ts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Col, Container, Row } from "react-bootstrap";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { APP_NAME, CONTEXT_ROOT, SERVER_API_PATH } from "./Config.ts";
import {
  ErrorBoundary,
  Menu,
  MenuItem,
  Sidebar,
} from "@vloryan/boot-api-ts/components/";
import { DashboardPage } from "./pages/DashboardPage.tsx";
import { Page404 } from "@vloryan/boot-api-ts/pages/";
import { initIcons } from "@vloryan/boot-api-ts/components/icons/";
import { joinPath } from "@vloryan/boot-api-ts/functions";

const queryClient = new QueryClient();

const typeIcons = new Map<string, IconDefinition>([
  ["clients", faPeopleGroup],
  ["client", faPerson],
  ["projects", faListUl],
  ["project", faDiagramProject],
  ["project/slot", faClock],
  ["activity/work", faBriefcase],
  ["activity/break", faMugHot],
]);

const sidebarMenu: Menu[] = [
  new Menu("Clients", typeIcons.get("clients")!, [
    new MenuItem("Client list", typeIcons.get("client")!, "/client"),
  ]),
  new Menu("Projects", typeIcons.get("project")!, [
    new MenuItem("Project list", typeIcons.get("projects")!, "/project"),
  ]),
];

export function App() {
  BootApiTsConfig.ApiPath = SERVER_API_PATH;
  useEffect(() => {
    initIcons(typeIcons);

    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)",
    );

    const handleDarkModeChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        document.body.setAttribute("data-bs-theme", "dark");
      } else {
        document.body.setAttribute("data-bs-theme", "light");
      }
    };

    darkModeMediaQuery.addEventListener("change", handleDarkModeChange);
    if (darkModeMediaQuery.matches) {
      document.body.setAttribute("data-bs-theme", "dark");
    } else {
      document.body.setAttribute("data-bs-theme", "light");
    }

    return () => {
      darkModeMediaQuery.removeEventListener("change", handleDarkModeChange);
    };
  }, []);
  const routerBase = CONTEXT_ROOT.endsWith("/")
    ? CONTEXT_ROOT.substring(0, CONTEXT_ROOT.length - 1)
    : CONTEXT_ROOT;
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AlertProvider>
          <div className="min-vh-100 min-vw-100">
            <Container fluid>
              <Row className="flex-nowrap">
                <Col className="col-auto p-0">
                  <Router base={routerBase}>
                    <Sidebar
                      menus={sidebarMenu}
                      appName={APP_NAME}
                      logo={logo.replace(
                        "/assets/",
                        joinPath(CONTEXT_ROOT, "assets") + "/",
                      )}
                    />
                  </Router>
                </Col>
                <Col className="ps-0 main">
                  <Router base={routerBase}>
                    <Switch>
                      <Route path="/" component={DashboardPage} />
                      {...Routes()}
                      <Route component={Page404} />
                    </Switch>
                  </Router>
                </Col>
              </Row>
            </Container>
          </div>
          <ReactQueryDevtools initialIsOpen={false} />
        </AlertProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
