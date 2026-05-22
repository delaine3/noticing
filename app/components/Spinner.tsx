type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  label?: string;
};

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-7 w-7 border-4",
};

export default function Spinner({
  size = "sm",
  label = "Loading",
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`${sizeClasses[size]} inline-block animate-spin rounded-full border-current border-t-transparent`}
    />
  );
}
