export function buildPageUrls(
  pathname: string,
  searchParams: URLSearchParams,
  page: number,
  totalPages: number,
): { prevUrl: string; nextUrl: string } {
  const build = (target: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (target > 1) params.set("page", String(target))
    else params.delete("page")
    return `${pathname}${params.toString() ? `?${params.toString()}` : ""}`
  }

  return {
    prevUrl: page > 1 ? build(page - 1) : "",
    nextUrl: page < totalPages ? build(page + 1) : "",
  }
}

export function pageCount(total: number, limit: number): number {
  return Math.max(1, Math.ceil(total / limit))
}
