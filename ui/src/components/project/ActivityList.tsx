import { Col } from "react-bootstrap";
import { Link } from "wouter";
import { ItemCellsFuncProps, ItemList } from "@vloryan/boot-api-ts/components/";
import { Included } from "@vloryan/ts-jsonapi-form/jsonapi/model/";
import { FetchOpts } from "@vloryan/ts-jsonapi-form/jsonapi/";
import { joinPath } from "@vloryan/boot-api-ts/functions";
import { faMoneyBill1, IconName } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toCurrency } from "@vloryan/boot-api-ts/functions/";
import { DeleteResourceButton } from "@vloryan/boot-api-ts/components";
export const ActivityList = ({
  resourcesUrl,
  locationUrl,
  fetchOpts,
}: {
  resourcesUrl: string;
  locationUrl: string;
  fetchOpts?: FetchOpts;
  included?: Included;
}) => {
  return (
    <ItemList
      resourcesUrl={resourcesUrl}
      locationUrl={locationUrl}
      opts={fetchOpts}
      Cells={({ obj, queryKey }: ItemCellsFuncProps) => {
        const objectUrl = joinPath(locationUrl, `/${obj.id}`);
        return (
          <>
            <Col xs="2">
              <Link to={objectUrl}>
                <FontAwesomeIcon
                  icon={["fas", obj.attributes!.icon as IconName]}
                  className="me-1"
                />
                {obj.attributes?.name as string}
              </Link>
            </Col>
            <Col>
              {obj.attributes?.billable ? (
                <>
                  <FontAwesomeIcon icon={faMoneyBill1} className="pe-1" />
                  {toCurrency((obj.attributes?.amount as number) || 0, "€")}
                </>
              ) : null}
            </Col>
            <Col>{obj.attributes?.description as string}</Col>
            <Col sm="2" className="text-end pe-0">
              <DeleteResourceButton
                url={objectUrl}
                queryKey={queryKey}
                size="sm"
              />
            </Col>
          </>
        );
      }}
    />
  );
};
