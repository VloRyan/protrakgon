import { Route, Switch } from "wouter";
import { DashboardPage } from "./pages/DashboardPage.tsx";
import { ProjectPage } from "./pages/project/ProjectPage.tsx";
import { ProjectListPage } from "./pages/project/ProjectListPage.tsx";
import { Page404 } from "./pages/404Page.tsx";
import { SlotPage } from "./pages/project/SlotPage.tsx";
import { ClientListPage } from "./pages/client/ClientListPage.tsx";
import { ClientPage } from "./pages/client/ClientPage.tsx";

export function Routes() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      {...ClientRoutes()}
      {...ProjectRoutes()}
      <Route component={Page404} />
    </Switch>
  );
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
