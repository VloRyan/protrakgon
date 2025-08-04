import "bootstrap/dist/css/bootstrap.min.css";

import { Menu, MenuItem, Sidebar } from "./components/Sidebar.tsx";
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
import { initIcons } from "./Icons.ts";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Routes } from "./Routes.tsx";
import { Router } from "wouter";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { AlertProvider } from "./components/context/AlertContext.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Col, Container, Row } from "react-bootstrap";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

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
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AlertProvider>
          <div className="min-vh-100 min-vw-100">
            <Container fluid>
              <Row className="flex-nowrap">
                <Col className="col-auto p-0">
                  <Sidebar menus={sidebarMenu} />
                </Col>
                <Col className="ps-0 main">
                  <Router>{Routes()}</Router>
                </Col>
              </Row>
            </Container>
          </div>
          <ReactQueryDevtools initialIsOpen={false} />
        </AlertProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
