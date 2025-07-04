import { ItemListPage } from "../../components/ItemListPage.tsx";
import { Col } from "react-bootstrap";
import { Link } from "wouter";
import { TypeIcon } from "../../components/TypeIcon.tsx";
import { ItemActionCol } from "../../components/ItemRow.tsx";
import { toLocaleDateTimeString } from "../../functions/date.ts";
import { capitalize } from "../../functions/strings.ts";

export function SlotListPage() {
  return (
    <ItemListPage
      searchProperty="name"
      itemCellsFunc={(obj, _includes, queryKey) => {
        const isOpen = new Date(obj.attributes!.end as string).getDate() == 1;
        return (
          <>
            <Col>
              <Link to={obj.id}>
                <TypeIcon type={obj.type as string} className="me-1"></TypeIcon>
                {obj.attributes && obj.attributes.activity !== undefined
                  ? capitalize(obj.attributes.activity as string)
                  : obj.id}
              </Link>
            </Col>
            <Col>
              {toLocaleDateTimeString(obj.attributes!.start! as string)}
            </Col>
            <Col>
              {obj.attributes!.end && !isOpen
                ? toLocaleDateTimeString(obj.attributes!.end! as string)
                : null}
            </Col>
            <ItemActionCol object={obj} queryKey={queryKey} />
          </>
        );
      }}
    />
  );
}
