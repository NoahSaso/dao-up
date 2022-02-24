import cn from "classnames"
import {
  Children,
  FunctionComponent,
  PropsWithChildren,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { IoChevronBack, IoChevronForward } from "react-icons/io5"

import { Button } from "@/components"
import { useRefCallback } from "@/hooks"

interface ChildOffset {
  left: number
  right: number
  center: number
}

type CarouselProps = PropsWithChildren<{
  className?: string
  childContainerClassName?: string
}>

export const Carousel: FunctionComponent<CarouselProps> = ({
  className,
  children,
  childContainerClassName,
}) => {
  const scrollContainer = useRef<HTMLDivElement | null>(null)
  // childOffsets will be equal to children.length - 2, due to padding.
  // Thus, childNum - 1 will get the offset for the child at position childNum.
  // Needs to be ref and not state because we don't want the onRefSet callback to run more than once.
  const childOffsets = useRef<ChildOffset[] | null>(null)
  // Update when childOffsets is updated.
  const [navVisible, setNavVisible] = useState(false)
  // childNum is index of actual content child offset by 1, since we pad both ends with an empty div element.
  const [centeredChildNum, setCenteredChildNum] = useState(1)
  const [pendingCenteredChildNum, setPendingCenteredChildNum] = useState<
    number | null
  >(null)
  // Use pending only if set. Pending is cleared once centeredChildNum is updated to match.
  const activeChildNum = pendingCenteredChildNum ?? centeredChildNum

  // Calculate offsets of children in scrollable area.
  // Update once everything is in place and if children are changed.
  const updateChildOffsets = useCallback(() => {
    if (!scrollContainer.current) {
      return childOffsets.current
    }

    const { children: allScrollChildren, scrollLeft } = scrollContainer.current
    // Get bounding rect of container.
    const containerRect = scrollContainer.current.getBoundingClientRect()
    // Ignore two padding children.
    const scrollChildren = Array.from(allScrollChildren).slice(1, -1)

    childOffsets.current = scrollChildren.map((child) => {
      const childRect = child.getBoundingClientRect()
      // Bounding rect's left is relative to viewport, but we want left in terms of from inner scrollable plane, so subtract container bounding rect's left.
      const left = scrollLeft + childRect.left - containerRect.left
      const right = scrollLeft + childRect.right - containerRect.left

      return {
        left,
        right,
        center: (left + right) / 2,
      }
    })
    // Display nav if more than one child.
    setNavVisible(childOffsets.current.length > 1)

    return childOffsets.current
  }, [scrollContainer, setNavVisible])
  // Update child offsets if children change.
  useEffect(() => {
    updateChildOffsets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children])

  // Calculate the centered child when scrolling so we can enable/disable buttons accordingly.
  const scrollListener = useCallback(
    (e: Event) => {
      // No centered child if no childOffsets.
      if (!childOffsets.current?.length) {
        return
      }

      const {
        scrollLeft,
        // Width of visible scrolling area.
        clientWidth: availableSpace,
      } = e.currentTarget as HTMLDivElement

      // The offset to the center of the screen from the beginning of the (maybe hidden) scrollable area.
      const containerScrollCenter = scrollLeft + availableSpace / 2

      // The index of the child that is centered.
      let childIndex = childOffsets.current.findIndex(
        ({ left, right }) =>
          left <= containerScrollCenter && right >= containerScrollCenter
      )
      // If no child is centered, choose child closest to center.
      if (childIndex === -1) {
        // Calculate distances of children's centers to scroll center.
        const childDistancesFromCenter = childOffsets.current.map(
          ({ left, right }) =>
            Math.abs((left + right) / 2 - containerScrollCenter)
        )
        // Choose the index with the minimum distance.
        childIndex = childDistancesFromCenter.reduce(
          (bestIndex, currDistance, index) =>
            currDistance < childDistancesFromCenter[bestIndex]
              ? index
              : bestIndex,
          // Assume first index is best so we have an initial comparison point.
          0
        )
      }

      // childNum is index of actual content child offset by 1, since we pad both ends with an empty div element.
      setCenteredChildNum(childIndex + 1)
      // If reached pendingCenteredChildNum, clear it so the actual value takes over again.
      setPendingCenteredChildNum((prev) =>
        childIndex + 1 === prev ? null : prev
      )
    },
    [setCenteredChildNum, setPendingCenteredChildNum]
  )

  const scrollChildToCenter = useCallback(
    (childNum: number) => {
      if (!scrollContainer.current || !childOffsets.current?.length) {
        return
      }

      // Store immediately so we can check what child is supposed to be centered in case the user is faster than the transition.
      setPendingCenteredChildNum(childNum)

      const {
        // Width of visible scrolling area.
        clientWidth: availableSpace,
      } = scrollContainer.current

      // Offset for chosen child.
      const childOffset =
        childOffsets.current[
          // Subtract 1 from childNum to exclude empty padding div elements.
          Math.max(0, Math.min(childNum - 1, childOffsets.current.length - 1))
        ]
      // Offset to the center of the screen from the beginning of the visible scrollable area.
      const containerScrollCenter = availableSpace / 2

      // Scroll child to center of visible area.
      scrollContainer.current.scrollTo({
        top: 0,
        left: childOffset.center - containerScrollCenter,
        behavior: "smooth",
      })
    },
    [scrollContainer, childOffsets, setPendingCenteredChildNum]
  )

  const onRefSet = useCallback(
    (scrollContainerNode: HTMLDivElement) => {
      // Listen for scrolling changes.
      scrollContainerNode.addEventListener("scroll", scrollListener)

      // Load initial child offsets.
      const offsets = updateChildOffsets() ?? []

      // Attempt to scroll more cards into view if space is available.

      const { clientWidth: availableSpace } = scrollContainerNode

      // Only check if we need to scroll if there are at least 3 actual children.
      if (offsets.length < 3) {
        return
      }

      // Check if the first 3 children would fit in the available space.

      // Calculate longest length of <left edge to center> and <center to right edge> for the three child sequence.
      const leftHalfWidth =
        offsets[1].center -
        offsets[0].left +
        // Ensure about ~2rem of padding on the left.
        32
      const rightHalfWidth =
        offsets[2].center -
        offsets[1].left +
        // Ensure about ~2rem of padding on the right.
        32
      const longerLeg = Math.max(leftHalfWidth, rightHalfWidth)

      // If longer leg is longer than half the available space (i.e. the full width extends offscreen when the middle child is centered), the three child sequence does not fit.
      if (longerLeg > availableSpace / 2) {
        return
      }

      // Scroll second child to center.
      scrollChildToCenter(2)
    },
    [scrollListener, updateChildOffsets, scrollChildToCenter]
  )
  const cleanupRef = useCallback(
    (scrollContainerNode: HTMLDivElement | null) =>
      scrollContainerNode?.removeEventListener("scroll", scrollListener),
    [scrollListener]
  )

  const { setRef: setScrollContainer } =
    // When ref is set, update child offsets and scroll to fit as many cards as possible.
    useRefCallback<HTMLDivElement>(scrollContainer, onRefSet, cleanupRef)

  const move = useCallback(
    (forward: boolean) => {
      if (!scrollContainer.current) return
      // Scroll in given direction.
      scrollChildToCenter(activeChildNum + (forward ? 1 : -1))
    },
    [scrollContainer, activeChildNum, scrollChildToCenter]
  )

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className={cn(
          "flex flex-row justify-start items-center gap-4 snap-x snap-mandatory overflow-x-auto w-full no-scrollbar",
          className
        )}
        ref={setScrollContainer}
      >
        {/* Allow first element to snap to center. */}
        <div className="snap-none shrink-0 w-1/2 h-[1px]"></div>

        {Children.map(children, (child, index) => (
          <div
            className={cn(
              "snap-center shrink-0 max-w-full",
              childContainerClassName
            )}
            key={index}
          >
            {child}
          </div>
        ))}

        {/* Allow last element to snap to center. */}
        <div className="snap-none shrink-0 w-1/2 h-[1px]"></div>
      </div>

      {navVisible && !!childOffsets.current && (
        <div className="flex flex-row gap-8 mt-5">
          <Button
            onClick={() => move(false)}
            bare
            // Cannot move backward if centered child is equal to first child.
            // centeredChildNum is index offset by 1 due to padding elements, so if equal to 1, first child is centered.
            disabled={activeChildNum <= 1}
          >
            <IoChevronBack className="text-green" size={24} />
          </Button>

          <Button
            onClick={() => move(true)}
            bare
            // Cannot move forward if centered child is equal to last child.
            // centeredChildNum is index offset by 1 due to padding elements, so if equal to length, last child is centered.
            disabled={activeChildNum >= childOffsets.current.length}
          >
            <IoChevronForward className="text-green" size={24} />
          </Button>
        </div>
      )}
    </div>
  )
}
