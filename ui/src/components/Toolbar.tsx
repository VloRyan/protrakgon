import {
  Button,
  Col,
  Container,
  Form,
  InputGroup,
  Navbar,
  Offcanvas,
  Row,
} from "react-bootstrap";
import { CreateButton, SaveButton } from "./Buttons.tsx";
import { ButtonProps } from "react-bootstrap/Button";
import { JSX, ReactElement, useRef, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { useFilter } from "ts-jsonapi-form/hooks/UseFilter.ts";
import {
  ObjectForm,
  SingleObjectForm,
} from "ts-jsonapi-form/form/ObjectForm.ts";
import { toParamFamily } from "ts-jsonapi-form/jsonapi/JsonApi.ts";
import { ObjectLike } from "ts-jsonapi-form/jsonapi/model/Types.ts";
import { trimSuffix } from "../functions/strings.ts";

export interface ToolbarProps {
  createButton?: ButtonProps;
  saveButton?: ButtonProps;
  customElements?: ReactElement[];
  searchProperty?: string;
  searchBarContent?: (form: ObjectForm) => ReactElement;
}

export function Toolbar(props: ToolbarProps) {
  const filter = useFilter();
  const searchString = useSearch();
  const [location, setLocation] = useLocation();
  const searchFieldRef = useRef<HTMLInputElement>(null);
  const [showSearchBar, setShowSearchBar] = useState(false);

  let createButton: JSX.Element | null = null;
  if (props.createButton != undefined) {
    createButton = (
      <Link to={location + "/new"}>
        <CreateButton {...props.createButton}></CreateButton>
      </Link>
    );
  }
  let saveButton: JSX.Element | null = null;
  if (props.saveButton != undefined) {
    saveButton = <SaveButton {...props.saveButton}></SaveButton>;
  }
  let searchBar: ReactElement | null = null;
  if (props.searchBarContent) {
    const searchForm = new SingleObjectForm({
      name: "FilterForm",
      object: filter,
      id: "FilterForm",
    });
    searchBar = (
      <Container fluid className="px-0">
        {props.searchBarContent(searchForm)}
        <Row className="pt-2">
          <Col className="d-flex justify-content-center">
            <Button
              variant="outline-primary"
              id="button-search"
              onClick={() => {
                setLocation(
                  location + updateSearchString(searchString, filter),
                );
                setShowSearchBar(false);
              }}
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </Button>
          </Col>
        </Row>
      </Container>
    );
  }
  return (
    <Navbar
      expand="lg"
      className="border-bottom border-light-subtle rounded-bottom mb-2"
    >
      <Container fluid className="px-0">
        <Row className="w-100 mx-0">
          <Col xs="5" className="d-flex justify-content-start">
            <img src="" height="40px" width="0px" alt="" />
          </Col>
          <Col xs="2" className="d-flex justify-content-center">
            {createButton}
            {saveButton}
            {props.customElements}
          </Col>
          <Col xs="5" className="d-flex justify-content-end">
            {props.searchProperty !== undefined ? (
              <InputGroup>
                <Form.Control
                  ref={searchFieldRef}
                  placeholder="Search..."
                  aria-label="Search"
                  aria-describedby="button-search"
                  defaultValue={filter[props.searchProperty] as string}
                  onKeyDown={(e) => {
                    if (e.code !== "Enter") {
                      return;
                    }
                    if (e.currentTarget.value) {
                      filter[props.searchProperty!] = e.currentTarget.value;
                    } else {
                      delete filter[props.searchProperty!];
                    }
                    setLocation(
                      location + updateSearchString(searchString, filter),
                    );
                  }}
                />
                <Button
                  variant={
                    Object.keys(filter).length === 0
                      ? "outline-primary"
                      : "primary"
                  }
                  id="button-search"
                  onClick={() => {
                    if (searchFieldRef.current?.value) {
                      filter[props.searchProperty!] =
                        searchFieldRef.current?.value ?? "";
                    } else {
                      delete filter[props.searchProperty!];
                    }
                    setLocation(
                      location + updateSearchString(searchString, filter),
                    );
                  }}
                >
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                </Button>
              </InputGroup>
            ) : null}
            {searchBar ? (
              <Button
                variant={
                  Object.keys(filter).length === 0
                    ? "outline-primary"
                    : "primary"
                }
                id="button-search"
                onClick={() => setShowSearchBar(true)}
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </Button>
            ) : null}
          </Col>
        </Row>
      </Container>
      <Offcanvas
        show={showSearchBar}
        onHide={() => setShowSearchBar(false)}
        placement="end"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Search</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="px-1">{searchBar}</Offcanvas.Body>
      </Offcanvas>
    </Navbar>
  );
}

function updateSearchString(currentSearch: string, filter: ObjectLike) {
  const search = trimSuffix(currentSearch, "&")
    .split("&")
    .filter((value) => !value.startsWith("filter["))
    .join("&");
  if (Object.keys(filter).length === 0) {
    return (search ? "?" : "") + search;
  }
  return (search ? "?" + search + "&" : "?") + toParamFamily("filter", filter);
}
