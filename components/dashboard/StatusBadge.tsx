type StatusBadgeProps = {
  value: string;
};

export default function StatusBadge({
  value,
}: StatusBadgeProps) {
  const className = value
    .toLowerCase()
    .replaceAll("_", "-");

  return (
    <span
      className={`dashboard-status dashboard-status--${className}`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}