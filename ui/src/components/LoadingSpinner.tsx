export const LoadingSpinner = ({ size }: { size?: "sm" | undefined }) => (
  <div className="container d-flex justify-content-center">
    <div
      className={"spinner-border" + (size ? ` spinner-border-${size}` : "")}
      role="status"
    >
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);
