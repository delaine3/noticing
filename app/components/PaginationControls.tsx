import Link from "next/link";

type PaginationControlsProps = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  basePath: string;
};

function buildPageHref(basePath: string, page: number) {
  return `${basePath}?page=${page}`;
}

export function PaginationControls({
  currentPage,
  pageSize,
  totalItems,
  basePath,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="sticky bottom-0 z-40 w-full px-4 py-3 backdrop-blur-xl"
      aria-label="Pagination"
    >
      <p className="text-sm text-[var(--ink-soft)]">
        Page {currentPage} of {totalPages} · {totalItems} total
      </p>

      <div className="flex flex-wrap gap-2">
        {hasPrevious ? (
          <Link
            href={buildPageHref(basePath, currentPage - 1)}
            className="secondary-button"
          >
            Previous
          </Link>
        ) : (
          <span className="secondary-button opacity-45">Previous</span>
        )}

        {Array.from({ length: totalPages }, (_, index) => index + 1)
          .filter((page) => {
            return (
              page === 1 ||
              page === totalPages ||
              Math.abs(page - currentPage) <= 1
            );
          })
          .map((page) => (
            <Link
              key={page}
              href={buildPageHref(basePath, page)}
              className={
                page === currentPage ? "submit-button" : "secondary-button"
              }
            >
              {page}
            </Link>
          ))}

        {hasNext ? (
          <Link
            href={buildPageHref(basePath, currentPage + 1)}
            className="secondary-button"
          >
            Next
          </Link>
        ) : (
          <span className="secondary-button opacity-45">Next</span>
        )}
      </div>
    </nav>
  );
}
