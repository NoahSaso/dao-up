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
