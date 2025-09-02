import { useLocation, useSearch } from "wouter";
import { ProjectEditor } from "../../components/project/ProjectEditor.tsx";
import { ItemPage } from "@vloryan/boot-api-ts/pages/";

import { Card, CardProps, Col, Container, Row } from "react-bootstrap";
import {
  CreateButton,
  IconButton,
  SearchBar,
} from "@vloryan/boot-api-ts//components/";
import { apiPath } from "../../functions/url.ts";
import {
  useAlertSubmitResponseHandler,
  useDocumentForm,
  useResource,
} from "@vloryan/boot-api-ts/hooks/";

import { SlotList } from "../../components/project/SlotList.tsx";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFileExport,
  faMagnifyingGlass,
  faMinimize,
  faMoneyBill1,
  faPlus,
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
import { ActivityList } from "../../components/project/ActivityList.tsx";
import { joinPath } from "@vloryan/boot-api-ts/functions";

export enum Comparator {
  Eq = 0,
  NeEq,
  Lt,
  LtEq,
  Gt,
  GtEq,
}

export function ProjectPage() {
  const [location] = useLocation();

  const searchString = useSearch();
  const fetchOpts = extractFetchOpts(searchString);

  const submitResponseHandler = useAlertSubmitResponseHandler();
  const { doc, isLoading, error, queryKey } = useResource(apiPath(location), {
    includes: ["client"],
  });
  const form = useDocumentForm({
    id: "projectForm",
    document: doc,
    queryKey: queryKey,
    apiUrl: apiPath(location.replace(/\/new/, "")),
    submitResponseHandler: submitResponseHandler,
  });
  if (fetchOpts.filter === undefined) {
    fetchOpts.filter = {};
  }
  let slotsFilter = fetchOpts.filter["slots"] as ObjectLike;
  if (slotsFilter === undefined) {
    slotsFilter = {};
    fetchOpts.filter["slots"] = slotsFilter;
  }
  if (slotsFilter.from === undefined) {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    slotsFilter.from = date.toISOString().substring(0, 10);
    slotsFilter.fromComparator = Comparator.Gt;
  }
  if (fetchOpts.page === undefined) {
    fetchOpts.page = { limit: -1, offset: undefined };
  } else if (fetchOpts.page.limit === undefined) {
    fetchOpts.page.limit = -1;
  }
  const projectId = form.getValue("id") as string | null;
  return (
    <ItemPage error={error} isLoading={isLoading} formId={form.id}>
      <form {...form.setup()}>
        <ProjectEditor form={form} />
      </form>
      <ActivitiesCard
        className="mt-2 mx-2"
        fetchOpts={{ filter: { projectId: projectId } }}
        disabled={projectId == null}
      />
      <SlotCard
        className="mt-2 mx-2"
        csvFileNamePrefix={
          form.getValue("client.name") + "_" + form.getValue("name")
        }
        fetchOpts={{
          filter: slotsFilter,
          page: fetchOpts.page,
          includes: fetchOpts.includes,
          sort: "-start",
        }}
        disabled={projectId == null}
      />
    </ItemPage>
  );
}

interface ActivitiesCardProps extends CardProps {
  fetchOpts: FetchOpts;
  disabled?: boolean;
}
const ActivitiesCard = ({
  fetchOpts,
  disabled,
  ...cardProps
}: ActivitiesCardProps) => {
  const [location] = useLocation();
  return (
    <Card {...cardProps}>
      <Card.Title className="text-center">
        <Row className="pt-2">
          <Col
            className={
              "d-flex justify-content-start ps-4" +
              (!disabled ? " fw-bold" : " text-secondary")
            }
          >
            Activities
          </Col>
          <Col className="d-flex justify-content-center" xs="auto">
            <CreateButton
              size="sm"
              title={!disabled ? "Create activity" : undefined}
              href={location + "/activity/new"}
              disabled={disabled}
            />
          </Col>
          <Col className="d-flex justify-content-end me-2 fs-6 small"></Col>
        </Row>
      </Card.Title>
      <Card.Body>
        {!disabled ? (
          <ActivityList
            resourcesUrl={apiPath(location, "activity")}
            locationUrl={joinPath(location, "activity")}
            fetchOpts={fetchOpts}
          />
        ) : null}
      </Card.Body>
    </Card>
  );
};

interface SlotCardProps extends CardProps {
  disabled?: boolean;
  csvFileNamePrefix: string;
  fetchOpts: FetchOpts;
}
const SlotCard = ({
  disabled,
  csvFileNamePrefix,
  fetchOpts,
  ...cardProps
}: SlotCardProps) => {
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [minimizeText, setMinimizeText] = useState(true);
  const [location] = useLocation();
  if (!fetchOpts.includes) {
    fetchOpts.includes = [];
  }
  if (fetchOpts.includes.indexOf("activity") == -1) {
    fetchOpts.includes?.push("activity");
  }
  const hasTimeFilter =
    fetchOpts.filter?.from ||
    fetchOpts.filter?.fromComparator ||
    fetchOpts.filter?.until ||
    fetchOpts.filter?.untilComparator;
  return (
    <Card {...cardProps}>
      <Card.Title className="text-center">
        <Row className="pt-2">
          <Col
            className={
              "d-flex justify-content-start ps-4" +
              (!disabled ? " fw-bold" : " text-secondary")
            }
          >
            Slots
          </Col>
          <Col className="d-flex justify-content-center" xs="auto">
            <IconButton
              icon={faPlus}
              variant="outline-primary"
              size="sm"
              href={location + "/slot/new"}
              disabled={disabled}
            />
            <IconButton
              icon={faFileExport}
              variant="outline-primary"
              size="sm"
              className="ms-2"
              title={!disabled ? "Download .csv file" : undefined}
              download={filenameFromFilter(fetchOpts.filter, csvFileNamePrefix)}
              href={apiPath(
                location,
                "/slot/csv" +
                  buildQueryString({
                    filter: fetchOpts.filter,
                  } satisfies FetchOpts),
              )}
              disabled={disabled}
            />
            <IconButton
              icon={faMinimize}
              variant={minimizeText ? "outline-primary" : "primary"}
              size="sm"
              title={
                !disabled
                  ? "Minimize text in columns (disable wrapping)"
                  : undefined
              }
              className="ms-2"
              onClick={() => setMinimizeText(!minimizeText)}
              disabled={disabled}
            />
          </Col>

          <Col className="d-flex justify-content-end me-2 fs-6 small align-items-center">
            {fetchOpts.filter && !disabled ? (
              <>
                <b>Filter:</b>
                <div className="ps-1">
                  {formatTimespan(
                    fetchOpts.filter.from as string,
                    fetchOpts.filter.fromComparator as number,
                    fetchOpts.filter.until as string,
                    fetchOpts.filter.untilComparator as number,
                  )}
                </div>
              </>
            ) : null}
            {fetchOpts.filter?.billable === true ? (
              <div className="ps-1">
                {hasTimeFilter ? "| " : null}
                <FontAwesomeIcon icon={faMoneyBill1} title="Billable" />
              </div>
            ) : null}
            <IconButton
              icon={faMagnifyingGlass}
              variant={
                fetchOpts.filter && Object.keys(fetchOpts.filter).length === 0
                  ? "outline-primary"
                  : "primary"
              }
              className="ms-2"
              size="sm"
              id="button-search"
              onClick={() => setShowSearchBar(true)}
              disabled={disabled}
            />
          </Col>
        </Row>
      </Card.Title>
      <Card.Body>
        {!disabled ? (
          <>
            <SlotList
              resourcesUrl={apiPath(location, "slot")}
              locationUrl={location}
              fetchOpts={fetchOpts}
              wrapText={minimizeText}
            ></SlotList>
            <SearchBar
              show={showSearchBar}
              setShow={setShowSearchBar}
              content={SlotSearchBarContent}
              filter={
                { slots: fetchOpts.filter as ObjectLike } satisfies ObjectLike
              }
              onBeforeSearch={ValidateSlotsForm}
            />
          </>
        ) : null}
      </Card.Body>
    </Card>
  );
};

const SlotSearchBarContent = (form: SingleObjectForm<ObjectLike>) => {
  const fields = new BootstrapFieldFactory(form);
  return (
    <Container>
      <Row>
        <Col sm="3" className="p-0">
          <fields.Select
            options={
              new Map([
                [Comparator.Eq + "", "="],
                [Comparator.NeEq + "", "<>"],
                [Comparator.Lt + "", "<"],
                [Comparator.LtEq + "", "<="],
                [Comparator.Gt + "", ">"],
                [Comparator.GtEq + "", ">="],
              ])
            }
            name="slots.fromComparator"
            label={"\u00A0"}
          />
        </Col>
        <Col className="p-0">
          <fields.Date name="slots.from" label="Start Date" required={true} />
        </Col>
      </Row>
      <Row>
        <Col sm="3" className="p-0">
          <fields.Select
            options={
              new Map([
                [Comparator.Eq + "", "="],
                [Comparator.NeEq + "", "<>"],
                [Comparator.Lt + "", "<"],
                [Comparator.LtEq + "", "<="],
                [Comparator.Gt + "", ">"],
                [Comparator.GtEq + "", ">="],
              ])
            }
            name="slots.untilComparator"
            label={"\u00A0"}
          />
        </Col>
        <Col className="p-0">
          <fields.Date name="slots.until" label="End Date" />
        </Col>
      </Row>
      <Row>
        <Col sm="3" className="p-0">
          <fields.CheckBox name="slots.billable" label="Billable" />
        </Col>
        <Col className="p-0">
          <fields.Number name="slots.amount" label="Amount" />
        </Col>
      </Row>
    </Container>
  );
};

const ValidateSlotsForm = (form: SingleObjectForm<ObjectLike>) => {
  if (!form.getValue("from")) {
    form.removeValue("fromComparator");
  }
};

function formatTimespan(
  start: string | undefined = undefined,
  startComparator: number = Comparator.Eq,
  end: string | undefined = undefined,
  endComparator: number = Comparator.Eq,
  delimiter: string = "...",
) {
  let span = "";
  if (start) {
    switch (startComparator ? startComparator : -1) {
      case -1:
      case Comparator.Eq:
      case Comparator.GtEq:
        span = formatDateString(start);
        break;
      case Comparator.Gt:
        span = ">" + formatDateString(start);
        break;
      case Comparator.NeEq:
        span = "!" + formatDateString(start);
        break;
      case Comparator.Lt:
        span = "<" + formatDateString(start);
        break;
      case Comparator.LtEq:
        span = "<=" + formatDateString(start);
        break;
      default:
        return startComparator + " " + formatDateString(start);
    }
  }
  if (end) {
    span += (start ? " " : "") + delimiter + " ";
    switch (endComparator ? endComparator : -1) {
      case -1:
      case Comparator.Eq:
      case Comparator.LtEq:
        span += formatDateString(end);
        break;
      case Comparator.Lt:
        span += "<" + formatDateString(end);
        break;
      case Comparator.NeEq:
        span += "!" + formatDateString(end);
        break;
      case Comparator.Gt:
        span += ">" + formatDateString(end);
        break;
      case Comparator.GtEq:
        span += ">=" + formatDateString(end);
        break;
      default:
        return endComparator + " " + formatDateString(end);
    }
  }
  return span;
}

function filenameFromFilter(filter?: ObjectLike, prefix: string = "") {
  return (
    (prefix ? prefix + "_" : "") +
    formatTimespan(
      filter?.from as string,
      filter?.fromComparator as number,
      filter?.until as string,
      filter?.untilComparator as number,
      "_",
    )
      .replace(">", "+")
      .replace("<", "-")
  );
}

export const testables = {
  formatTimespan,
};
