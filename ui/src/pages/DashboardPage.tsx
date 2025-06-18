import logo from "../../assets/icon.svg";
import { APP_NAME } from "../Config.ts";
import { Col, Container, Row } from "react-bootstrap";

export const DashboardPage = () => {
  return (
    <Container fluid className="d-flex justify-content-center">
      <Row className="align-items-center mt-5">
        <Col>
          <img
            src={logo}
            className="me-2"
            alt={APP_NAME}
            title={APP_NAME}
            width="128"
            height="128"
          />
        </Col>
        <Col>
          <h1 className="text-info fw-bold">{APP_NAME}</h1>
        </Col>
      </Row>
    </Container>
  );
};
