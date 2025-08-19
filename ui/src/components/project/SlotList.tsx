import { Col } from "react-bootstrap";
import { Link } from "wouter";
import { TypeIcon } from "../TypeIcon.tsx";
import { capitalize, padLeft } from "@vloryan/boot-api-ts/functions/";
import { formatDateString } from "@vloryan/boot-api-ts/functions/date.ts";
import {
  ItemActionCol,
  ItemGroup,
  ItemList,
} from "@vloryan/boot-api-ts/components/";
import { ResourceObject } from "@vloryan/ts-jsonapi-form/jsonapi/model/";
import { FetchOpts } from "@vloryan/ts-jsonapi-form/jsonapi/";

export const SlotList = ({
  resourcesUrl,
  locationUrl,
  fetchOpts,
}: {
  resourcesUrl: string;
  locationUrl: string;
  fetchOpts: FetchOpts;
}) => {
  return (
    <ItemList
      resourcesUrl={resourcesUrl}
      locationUrl={locationUrl}
      opts={fetchOpts}
      itemCellsFunc={(obj, _includes, queryKey) => {
        const isOpen = new Date(obj.attributes!.end as string).getDate() == 1;
        const timeDiff =
          !isOpen && obj.attributes!.end
            ? new Date(obj.attributes!.end as string).getTime() -
              new Date(obj.attributes!.start as string).getTime()
            : 0;
        return (
          <>
            <Col xs="1" sm="auto">
              <Link to={locationUrl + `/slot/${obj.id}`}>
                <TypeIcon
                  type={
                    obj.attributes?.activity
                      ? "activity/" + (obj.attributes?.activity as string)
                      : ""
                  }
                  className="me-1"
                  title={capitalize(obj.attributes?.activity as string)}
                />
              </Link>
            </Col>
            <Col xs="6" sm="2" className="pe-0">
              <Link to={locationUrl + `/slot/${obj.id}`}>
                <div className="font-monospace justify-content-end">
                  {formatTime(obj.attributes!.start! as string)}
                  {obj.attributes!.end && !isOpen
                    ? " - " + formatTime(obj.attributes!.end! as string)
                    : null}
                </div>
              </Link>
            </Col>
            <Col
              xs="3"
              sm="2"
              className="justify-content-end align-middle ps-0"
            >
              <div className="font-monospace justify-content-end middle small">
                {timeDiff > 0 ? formatDiff(timeDiff) : null}
              </div>
            </Col>
            <ItemActionCol object={obj} queryKey={queryKey} />
          </>
        );
      }}
      groupFunc={(objs) => {
        const groups: ItemGroup[] = [];
        if (objs.length == 0) {
          return [];
        }
        const firstItem = objs[0];
        let currentDate = new Date(
          (firstItem.attributes!["start"] as string).substring(0, 10),
        );
        let currentGroup = {
          id: groups.length + "",
          headerFunc: headerFunc,
          data: [] as ResourceObject[],
        } satisfies ItemGroup;
        groups.push(currentGroup);
        objs.forEach((obj) => {
          const startDate = new Date(
            (obj.attributes!["start"] as string).substring(0, 10),
          );
          if (startDate.getTime() == currentDate.getTime()) {
            currentGroup.data.push(obj);
          } else {
            currentGroup = {
              id: groups.length + "",
              headerFunc: headerFunc,
              data: [],
            } satisfies ItemGroup;
            currentGroup.data.push(obj);
            currentDate = startDate;
            groups.push(currentGroup);
          }
        });
        return groups;
      }}
    />
  );
};
function headerFunc(group: ItemGroup) {
  const firstItem = group.data![0];
  const startDate = new Date(
    (firstItem.attributes!["start"] as string).substring(0, 10),
  );
  const timeByType = new Map<string, number>();
  group.data?.forEach((obj) => {
    const isOpen = new Date(obj.attributes!.end as string).getDate() == 1;
    const activity = obj.attributes!.activity as string;
    const timeDiff =
      !isOpen && obj.attributes!.end
        ? new Date(obj.attributes!.end as string).getTime() -
          new Date(obj.attributes!.start as string).getTime()
        : 0;
    let sum = timeByType.get(activity);
    sum = sum ? sum + timeDiff : timeDiff;
    timeByType.set(activity, sum);
  });
  return (
    <>
      <Col className="fw-bold pe-0" xs="4" sm="auto">
        {formatDateString(startDate.toISOString())}
      </Col>
      <Col>
        {Array.from(timeByType).map(([key, value], index) => (
          <small key={index} className={index > 0 ? "ps-2" : ""}>
            <TypeIcon type={"activity/" + key} title={capitalize(key)} />
            <small>{formatDiff(value)}</small>
          </small>
        ))}
      </Col>
    </>
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
