import { ChangeEvent, useRef, useState } from "react";
import { Form } from "react-bootstrap";
import Dropdown from "react-bootstrap/Dropdown";
import { ResourceObject } from "ts-jsonapi-form/jsonapi/model/Objects.ts";
import { CollectionResourceDoc } from "ts-jsonapi-form/jsonapi/model/Document.ts";
import { MEDIA_TYPE } from "ts-jsonapi-form/jsonapi/JsonApi.ts";
import { LoadingSpinner } from "../LoadingSpinner.tsx";

interface ResourceObjectLookupFieldProps {
  name: string;
  url: string;
  defaultValue?: ResourceObject | null;
  onSelectionChange?: (e: ResourceObject | null) => void;
}

export const ResourceObjectLookupField = ({
  url,
  defaultValue,
  onSelectionChange,
}: ResourceObjectLookupFieldProps) => {
  const [results, setResults] = useState<ResourceObject[]>([]);
  const [showDropDown, setShowDropDown] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const fieldRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const nameValue = e.target.value;
    setResults([]);
    if (nameValue.length > 1) {
      setShowDropDown(true);
      setIsLoading(true);
      fetchResults(url, "name", e.target.value)
        .then((doc) => {
          setResults(doc.data);
          setIsLoading(false);
        })
        .catch((err) => {
          setIsLoading(false);
          console.error(err);
        });
    }
  };
  const onSelected = (selected: ResourceObject | null) => {
    fieldRef.current!.value = (selected?.attributes?.name as string) ?? "";
    setShowDropDown(false);
    setIsLoading(false);
    setResults([]);
    if (onSelectionChange) {
      onSelectionChange(selected);
    }
  };

  return (
    <>
      <Form.Control
        ref={fieldRef}
        type="text"
        autoComplete="off"
        onChange={handleInputChange}
        defaultValue={defaultValue?.attributes?.name as string}
        onKeyDown={(event) => {
          if (event.code === "ArrowDown") {
            if (menuRef.current) {
              const firstItem = menuRef.current
                .children[0] as HTMLAnchorElement;
              firstItem.focus();
            }
          }
        }}
      />
      <Dropdown
        show={showDropDown}
        onToggle={(nextShow, meta) => {
          if (!nextShow && meta.source !== "select") {
            setShowDropDown(false);
            onSelected(null);
          }
        }}
      >
        <Dropdown.Menu ref={menuRef}>
          {isLoading ? (
            <Dropdown.Item>
              <LoadingSpinner />
            </Dropdown.Item>
          ) : (
            results.length > 0 &&
            results.map((result: ResourceObject) => (
              <Dropdown.Item
                className="dropdown-item"
                key={result.id}
                onClick={() => {
                  onSelected(result);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onSelected(result);
                  }
                }}
              >
                {result.attributes?.name as string}
              </Dropdown.Item>
            ))
          )}
        </Dropdown.Menu>
      </Dropdown>
    </>
  );
};

async function fetchResults(
  url: string,
  filterName: string,
  filterValue: string,
  limit: string = "10",
): Promise<CollectionResourceDoc> {
  return fetch(
    url + `?filter[${filterName}]=${filterValue}&page[limit]=${limit}`,
    {
      headers: {
        "Content-Type": MEDIA_TYPE,
      },
    },
  )
    .then((res) => res.json())
    .then((json) => {
      return json as CollectionResourceDoc;
    });
}
