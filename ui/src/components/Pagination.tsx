import { Button, Col, Row } from "react-bootstrap";
import { Link } from "wouter";

interface linkElement {
  url: string;
  caption: string;
  current: boolean;
}
export const PaginationRow = ({
  location,
  searchString,
  offset,
  totalPages,
}: {
  location: string;
  searchString: string;
  offset: number;
  totalPages: number;
}) => {
  const index = Math.floor(offset);
  const start = Math.max(index - 5, 0);
  const end = Math.min(start + 10, totalPages);
  const links: linkElement[] = [];
  for (let i = start; i < end; i++) {
    links.push({
      url:
        location + "?" + searchStringSet(searchString, "page[offset]", i + ""),
      caption: i + "",
      current: i === index,
    } satisfies linkElement);
  }
  if (totalPages < 2) {
    return null;
  }
  return (
    <Row className="mt-2">
      <Col className="text-center">
        <div className="btn-group" role="group" aria-label="Pagination">
          {index > 0 ? (
            <Link
              key={index - 1}
              to={
                location +
                "?" +
                searchStringSet(searchString, "page[offset]", index - 1 + "")
              }
              className="btn btn-outline-primary"
            >
              &lt;
            </Link>
          ) : (
            <Button className="btn btn-outline-secondary" disabled>
              &lt;
            </Button>
          )}
          {links.map((e, index) => (
            <Link
              key={index}
              to={e.url}
              className={
                "btn" + (e.current ? " btn-primary" : " btn-outline-primary")
              }
            >
              {e.caption}
            </Link>
          ))}
          {index < totalPages - 1 ? (
            <Link
              key={index + 1}
              to={
                location +
                "?" +
                searchStringSet(searchString, "page[offset]", index + 1 + "")
              }
              className="btn btn-outline-primary"
            >
              &gt;
            </Link>
          ) : (
            <Button className="btn btn-outline-secondary" disabled>
              &gt;
            </Button>
          )}
        </div>
      </Col>
    </Row>
  );
};
function searchStringSet(
  searchString: string,
  name: string,
  value: string,
): string {
  const urlParams = new URLSearchParams(searchString);
  urlParams.set(name, value);
  return urlParams.toString();
}
