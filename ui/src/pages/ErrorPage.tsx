export const ErrorPage = ({ error }: { error: Error }) => {
  return (
    <div className="container-fluid">
      <span className="d-flex justify-content-center mt-5">
        <h1>{error.message}</h1>
      </span>
    </div>
  );
};
