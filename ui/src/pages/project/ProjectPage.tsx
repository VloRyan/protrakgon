import { Link, useLocation, useSearch } from "wouter";
import { ProjectEditor } from "../../components/project/ProjectEditor.tsx";
import { ItemPage } from "@vloryan/boot-api-ts/pages/";

import { Button, Card, Col, Container, Row } from "react-bootstrap";
import {
  CreateButton,
  IconButton,
  SearchBar,
} from "@vloryan/boot-api-ts//components/";
import { apiPath } from "../../functions/url.ts";
import {
  useAlertSubmitResponseHandler,
  useResource,
  useResourceObjectForm,
} from "@vloryan/boot-api-ts/hooks/";

import { SlotList } from "../../components/project/SlotList.tsx";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileExport,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import {
  buildQueryString,
  extractFetchOpts,
  FetchOpts,
} from "@vloryan/ts-jsonapi-form/jsonapi/";
import { SingleObjectForm } from "@vloryan/ts-jsonapi-form/form/";
import { BootstrapFieldFactory } from "@vloryan/boot-api-ts/components/fields/";
import { ObjectLike } from "@vloryan/ts-jsonapi-form/jsonapi/model/";
import { formatDateString } from "@vloryan/boot-api-ts/functions/";

export function ProjectPage() {
  const [location] = useLocation();

  const searchString = useSearch();
  const fetchOpts = extractFetchOpts(searchString);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const submitResponseHandler = useAlertSubmitResponseHandler();
  const { doc, isLoading, error, queryKey } = useResource(apiPath(location));
  const form = useResourceObjectForm({
    id: "projectForm",
    document: doc,
    queryKey: queryKey,
    apiUrl: apiPath(location.replace(/\/new/, "")),
    submitResponseHandler: submitResponseHandler,
  });
  if (fetchOpts.filter === undefined) {
    fetchOpts.filter = {};
  }
  if (fetchOpts.filter["from"] === undefined) {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    fetchOpts.filter["from"] = date.toISOString().substring(0, 10);
    fetchOpts.filter["fromComparator"] = "4";
  }
  if (fetchOpts.page === undefined) {
    fetchOpts.page = { limit: -1, offset: undefined };
  } else if (fetchOpts.page.limit === undefined) {
    fetchOpts.page.limit = -1;
  }
  fetchOpts.sort = "-start";
  return (
    <ItemPage error={error} isLoading={isLoading} formId={form.id}>
      <form {...form.setup()}>
        <ProjectEditor form={form} />
      </form>
      <Card className="mt-2 mx-3">
        <Card.Title className="text-center">
          <Row className="pt-2">
            <Col className="d-flex justify-content-start ps-4 fw-bold">
              Slots
            </Col>
            <Col className="d-flex justify-content-center" xs="auto">
              <Link to={location + "/slot/new"} className="ms-2">
                <CreateButton size="sm" />
              </Link>
              <DownloadSlotCSVButton opts={fetchOpts} key={"dlCSV"} />
            </Col>
            <Col className="d-flex justify-content-end me-2 fs-6 small">
              {formatTimespan(
                fetchOpts.filter["from"] as string,
                fetchOpts.filter["fromComparator"] as string,
                fetchOpts.filter["until"] !== undefined
                  ? (fetchOpts.filter["until"] as string)
                  : undefined,
                fetchOpts.filter["untilComparator"] as string,
              )}

              <Button
                variant={
                  Object.keys(fetchOpts.filter).length === 0
                    ? "outline-primary"
                    : "primary"
                }
                className="ms-2"
                id="button-search"
                onClick={() => setShowSearchBar(true)}
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </Button>
            </Col>
          </Row>
        </Card.Title>
        <Card.Body>
          <SlotList
            resourcesUrl={apiPath(location, "slot")}
            locationUrl={location}
            fetchOpts={fetchOpts}
          ></SlotList>
          <SearchBar
            show={showSearchBar}
            setShow={setShowSearchBar}
            content={SlotSearchBarContent}
            filter={fetchOpts.filter}
            onBeforeSearch={ValidateForm}
          />
        </Card.Body>
      </Card>
    </ItemPage>
  );
}

const SlotSearchBarContent = (form: SingleObjectForm<ObjectLike>) => {
  const fields = new BootstrapFieldFactory(form);
  return (
    <Container>
      <Row>
        <Col sm="3" className="p-0">
          <fields.Select
            options={
              new Map([
                ["0", "="],
                ["1", "<>"],
                ["2", "<"],
                ["3", "<="],
                ["4", ">"],
                ["5", ">="],
              ])
            }
            name="fromComparator"
            label={"\u00A0"}
          />
        </Col>
        <Col className="p-0">
          <fields.Date name="from" label="Start Date" required={true} />
        </Col>
      </Row>
      <Row>
        <Col sm="3" className="p-0">
          <fields.Select
            options={
              new Map([
                ["0", "="],
                ["1", "<>"],
                ["2", "<"],
                ["3", "<="],
                ["4", ">"],
                ["5", ">="],
              ])
            }
            name="untilComparator"
            label={"\u00A0"}
          />
        </Col>
        <Col className="p-0">
          <fields.Date name="until" label="End Date" />
        </Col>
      </Row>
    </Container>
  );
};
const ValidateForm = (form: SingleObjectForm<ObjectLike>) => {
  if (!form.getValue("from")) {
    form.removeValue("fromComparator");
  }
};

function formatTimespan(
  start: string,
  startComparator: string,
  end: string | undefined,
  endComparator: string,
  delimiter: string = " ... ",
) {
  if (!start) {
    return "";
  }
  let span = "";
  switch (startComparator ? startComparator : "") {
    case "":
    case "0":
    case "4":
    case "5":
      span = formatDateString(start);
      break;
    case "1":
      span = "!" + formatDateString(start);
      break;
    case "2":
      span = "-" + formatDateString(start);
      break;
    case "3":
      span = "-=" + formatDateString(start);
      break;
    default:
      return "?" + formatDateString(start);
  }
  if (end !== undefined) {
    span += delimiter;
    switch (endComparator ? endComparator : "") {
      case "":
      case "0":
      case "2":
      case "3":
        span += formatDateString(end);
        break;
      case "1":
        span += "!" + formatDateString(end);
        break;
      case "4":
        span += formatDateString(end) + "+";
        break;
      case "5":
        span += formatDateString(end) + "+";
        break;
      default:
        return "?" + formatDateString(end);
    }
  }
  return span;
}

const DownloadSlotCSVButton = ({ opts }: { opts: FetchOpts }) => {
  const [location] = useLocation();
  const fileName = formatTimespan(
    opts.filter!["from"] as string,
    opts.filter!["fromComparator"] as string,
    opts.filter!["until"] !== undefined
      ? (opts.filter!["until"] as string)
      : undefined,
    opts.filter!["untilComparator"] as string,
    "_",
  );
  return (
    <a
      download={fileName + ".csv"}
      className="ms-2"
      title="Download .csv file"
      href={apiPath(location, "/slot/csv" + buildQueryString(opts))}
    >
      <IconButton icon={faFileExport} variant={"outline-primary"} size="sm" />
    </a>
  );
};
