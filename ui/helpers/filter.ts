enum Filter {
  Status = "status",
}
type FilterType = `${Filter}`

type FilterFunction = (campaign: Campaign) => boolean
const filterFnMakers: Record<FilterType, (value: string) => FilterFunction> = {
  status: (value) => (campaign) => campaign.status === value,
}
const filterKeys = Object.keys(filterFnMakers)
// Matches `key{whitespace}:{whitespace}value` or `key{whitespace}:{whitespace}"value"`
const filterRegex = new RegExp(
  `(${filterKeys.join("|")})\\s*:\\s*([^\\s]+|"[^"]+")`,
  "gi"
)

// Filter utils for modifying string.
const singleFilterMaker = (key: string, value: string) =>
  new RegExp(`${key}\\s*:\\s*"?${value}"?`, "gi")
export const filterExists = (filter: string, key: string, value: string) =>
  singleFilterMaker(key, value).test(filter)
export const addFilter = (filter: string, key: string, value: string) =>
  (filter + ` ${key}:${value}`).trim()
export const removeFilter = (filter: string, key: string, value: string) =>
  filter.replaceAll(singleFilterMaker(key, value), "").trim()

export const getFilterFns = (filter: string) => {
  let query = filter

  // Extract filter keys from filter string, remove from query, and make filter functions for each filter detected.
  const extractedFilterFns = (filter.match(filterRegex) ?? []).reduce(
    (prev, curr) => {
      const key = curr.split(":")[0].trim() as FilterType
      if (!(key in filterFnMakers)) return prev

      // Remove filter key/value from search string.
      query = query.replace(curr, "").trim()

      const value = curr
        .split(":")
        .slice(1)
        .join(":")
        .trim()
        // Remove quotes from ends of value if present.
        .replace(/^"/, "")
        .replace(/"$/, "")
        .trim()

      // Make filter function and add to active filters.
      const filterFn = filterFnMakers[key as FilterType](value)

      return {
        ...prev,
        [key]: [...(prev[key] ?? []), filterFn],
      }
    },
    {} as Record<FilterType, FilterFunction[] | undefined>
  )

  // Combine object with arrays of filter functions into array of filter functions,
  // where the arrays in the object are OR'd together.
  // Example: { key: [fn1, fn2, fn3], another: [fn4] } => [fn1 || fn2 || fn3, fn4]
  const filterFns = Object.entries(extractedFilterFns).reduce(
    (prev, [key, fns]) => {
      if (!fns || fns.length === 0) return prev

      return [
        ...prev,
        // Create a new function that returns true if any of the filter functions return true.
        (campaign: Campaign) => fns.some((fn) => fn(campaign)),
      ]
    },
    [] as FilterFunction[]
  )

  return { query, filterFns }
}

export const extractPageInfo = (page: number, size: number): PageInfo => ({
  startIndex: (page - 1) * size,
  endIndex: page * size,
})

export const getPageFromData = <T>(data: any[], page: number, size: number) => {
  const { startIndex, endIndex } = extractPageInfo(page, size)

  let pageData: any[]
  if (startIndex > data.length) {
    pageData = []
  } else if (endIndex > data.length) {
    pageData = data.slice(startIndex, data.length)
  } else {
    pageData = data.slice(startIndex, endIndex)
  }

  return pageData
}
