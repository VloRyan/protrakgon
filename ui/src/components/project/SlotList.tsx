import { Col, Row } from "react-bootstrap";
import { Link } from "wouter";
import { padLeft } from "@vloryan/boot-api-ts/functions/";
import { formatDateString } from "@vloryan/boot-api-ts/functions/date.ts";
import {
  ItemActionCol,
  ItemGroup,
  ItemList,
  GroupHeaderProps,
  ItemCellsFuncProps,
} from "@vloryan/boot-api-ts/components/";
import {
  Included,
  ResourceObject,
  CollectionResourceDoc,
} from "@vloryan/ts-jsonapi-form/jsonapi/model/";
import { FetchOpts } from "@vloryan/ts-jsonapi-form/jsonapi/";
import { joinPath, toCurrency } from "@vloryan/boot-api-ts/functions";
import { findInclude } from "@vloryan/ts-jsonapi-form/jsonapi";
import { ResourceIdentifierObject } from "@vloryan/ts-jsonapi-form/jsonapi/model";
import { IconName } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { QueryKey } from "@tanstack/query-core";

export const SlotList = ({
  resourcesUrl,
  locationUrl,
  fetchOpts,
  wrapText,
}: {
  resourcesUrl: string;
  locationUrl: string;
  fetchOpts: FetchOpts;
  wrapText: boolean;
}) => {
  return (
    <ItemList
      resourcesUrl={resourcesUrl}
      locationUrl={locationUrl}
      opts={fetchOpts}
      Cells={({ obj, includes, queryKey }: ItemCellsFuncProps) =>
        SlotCells(obj, includes, queryKey, locationUrl, wrapText)
      }
      groupFunc={groupByTimespan}
      GroupHeader={SlotGroupHeader}
    />
  );
};

const groupByTimespan = (doc: CollectionResourceDoc) => {
  const groups: ItemGroup[] = [];
  if (doc.data.length == 0) {
    return [];
  }
  const firstItem = doc.data[0];
  let currentDate = new Date(
    (firstItem.attributes!["start"] as string).substring(0, 10),
  );
  let currentGroup = {
    data: [] as ResourceObject[],
  } satisfies ItemGroup;
  groups.push(currentGroup);
  doc.data.forEach((obj) => {
    const startDate = new Date(
      (obj.attributes!["start"] as string).substring(0, 10),
    );
    if (startDate.getTime() == currentDate.getTime()) {
      currentGroup.data.push(obj);
    } else {
      currentGroup = {
        data: [],
      } satisfies ItemGroup;
      currentGroup.data.push(obj);
      currentDate = startDate;
      groups.push(currentGroup);
    }
  });
  return groups;
};

const SlotCells = (
  obj: ResourceObject,
  includes: Included,
  queryKey: QueryKey,
  locationUrl: string,
  wrapText: boolean,
) => {
  const timeDiff = obj.attributes!.end
    ? new Date(obj.attributes!.end as string).getTime() -
      new Date(obj.attributes!.start as string).getTime()
    : 0;
  const objectUrl = joinPath(locationUrl, "/slot/${obj.id}");
  const activity = findInclude(
    obj.relationships?.activity.data as unknown as ResourceIdentifierObject,
    includes,
  );
  return (
    <>
      <Col xs="3" sm="auto" className="p-0">
        <Link to={locationUrl + `/slot/${obj.id}`}>
          <div className="font-monospace justify-content-end">
            {formatTime(obj.attributes!.start! as string)}
            {obj.attributes!.end
              ? " - " + formatTime(obj.attributes!.end! as string)
              : null}
          </div>
        </Link>
      </Col>
      <Col xs="1" className="small pe-0 ">
        <FontAwesomeIcon
          icon={[
            "fas",
            activity ? (activity.attributes!.icon as IconName) : "bomb",
          ]}
          title={activity ? (activity.attributes?.name as string) : ""}
          className="pe-1"
        />
        {activity?.attributes?.name as string}
      </Col>
      <Col xs="1" sm="auto" className="small">
        {timeDiff > 0 ? formatDiff(timeDiff) : null}
      </Col>
      <Col className="small">
        <div style={wrapText ? { whiteSpace: "pre-wrap" } : {}}>
          {obj?.attributes?.description as string}
        </div>
      </Col>
      <ItemActionCol objectUrl={objectUrl} queryKey={queryKey} />
    </>
  );
};
interface ActivityGroup {
  activity: ResourceObject;
  time: number;
  sum: number;
}
function SlotGroupHeader({ group, includes }: GroupHeaderProps) {
  const firstItem = group.data![0];
  const startDate = new Date(
    (firstItem.attributes!["start"] as string).substring(0, 10),
  );
  const groupsByType = new Map<string, ActivityGroup>();
  group.data?.forEach((obj) => {
    const activity = findInclude(
      obj.relationships?.activity.data as unknown as ResourceIdentifierObject,
      includes,
    );
    if (!activity) {
      return;
    }

    const timeDiff = obj.attributes!.end
      ? new Date(obj.attributes!.end as string).getTime() -
        new Date(obj.attributes!.start as string).getTime()
      : 0;

    let group = groupsByType.get(activity!.id);
    if (!group) {
      group = { activity: activity, sum: 0, time: 0 };
      groupsByType.set(activity!.id, group);
    }
    group!.time = group!.time + timeDiff;
    if (activity.attributes!.billable) {
      group.sum +=
        Math.ceil(getHours(timeDiff)) * (activity.attributes!.amount as number);
    }
  });
  let amountSum = 0.0;
  groupsByType.forEach((group) => {
    amountSum += group.sum;
  });
  return (
    <Row className="align-items-center bg-primary-subtle">
      <Col xs="4"></Col>
      <Col xs="4" className="fw-bold text-center">
        {formatDateString(startDate.toISOString())}
      </Col>
      <Col xs="1" className="text-end">
        <small className="text-success">
          {amountSum > 0 ? <b>{toCurrency(amountSum, "€")}</b> : ""}
        </small>
      </Col>
      <Col>
        {Array.from(groupsByType).map(([, group], index) => (
          <small key={index} className={index > 0 ? "ps-2" : ""}>
            <FontAwesomeIcon
              icon={["fas", group.activity!.attributes!.icon as IconName]}
              title={group.activity!.attributes!.name as string}
              className="ps-1"
            />
            {formatDiff(group.time)}
          </small>
        ))}
      </Col>
    </Row>
  );
}

function formatTime(s: string) {
  const d = new Date(s);
  return d.toTimeString().slice(0, 5);
}

function formatDiff(diff: number) {
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return `${padLeft(hours, 2, "\u00A0") + "h"} ${
    minutes > 0 ? padLeft(minutes, 2, "\u00A0") + "m" : ""
  }`;
}

function getHours(diff: number) {
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return hours + minutes / 60;
}
