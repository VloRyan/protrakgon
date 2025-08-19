import { Route } from "wouter";
import { ProjectPage } from "./pages/project/ProjectPage.tsx";
import { ProjectListPage } from "./pages/project/ProjectListPage.tsx";
import { SlotPage } from "./pages/project/SlotPage.tsx";
import { ClientListPage } from "./pages/client/ClientListPage.tsx";
import { ClientPage } from "./pages/client/ClientPage.tsx";

export function Routes() {
  return [...ClientRoutes(), ...ProjectRoutes()];
  function ClientRoutes() {
    return [
      <Route path="/client" component={ClientListPage} />,
      <Route path="/client/:id" component={ClientPage} />,
    ];
  }

  function ProjectRoutes() {
    return [
      <Route path="/project" component={ProjectListPage} />,
      <Route path="/project/:id" component={ProjectPage} />,
      <Route path="/project/:id/slot/:id" component={SlotPage} />,
    ];
  }
}
