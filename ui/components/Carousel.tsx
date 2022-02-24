import cn from "classnames"
import {
  Children,
  FunctionComponent,
  PropsWithChildren,
  useCallback,
} from "react"
import { IoChevronBack, IoChevronForward } from "react-icons/io5"

import { Button } from "@/components"
import { useRefCallback } from "@/hooks"

const centerChildInContainer = (
  container: HTMLDivElement,
  // childNum is index of actual content child offset by 1, since we pad both ends with an empty div element.
  childNum: number
) => {
  // Clamp to allowed children.
  const childIndex = Math.max(
    1,
    Math.min(childNum, container.children.length - 2)
  )
  const childRect = container.children[childIndex].getBoundingClientRect()

  const newLeft =
    container.scrollLeft +
    // Left is relative to visible width of parent (clientWidth).
    // Adjust scrollLeft to middle of child, and then shift scroll left by
    // half the visible width of the parent to center the child.
    childRect.left +
    childRect.width / 2 -
    container.clientWidth / 2

  // Scroll child to center.
  container.scrollTo({
    top: 0,
    left: newLeft,
    behavior: "smooth",
  })
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
  const { ref: scrollContainer, setRef: setScrollContainer } =
    // When ref is set, scroll to fit as many cards as possible.
    useRefCallback<HTMLDivElement>((scrollContainerNode) => {
      const {
        children: allScrollChildren,
        // Width of visible scrolling area.
        clientWidth: availableSpace,
      } = scrollContainerNode
      // Ignore two padding children.
      const scrollChildren = Array.from(allScrollChildren).slice(1, -1)

      // Only check if we need to scroll if there are at least 3 actual children.
      if (scrollChildren.length < 3) {
        return
      }

      // Check if the first 3 children would fit in the available space.
      const firstChild = scrollChildren[1].getBoundingClientRect()
      const secondChild = scrollChildren[2].getBoundingClientRect()
      const thirdChild = scrollChildren[2].getBoundingClientRect()
      const leftHalfWidth =
        secondChild.left +
        secondChild.width / 2 -
        firstChild.left +
        // Ensure about ~2rem of padding on the left.
        32
      const rightHalfWidth =
        thirdChild.left +
        thirdChild.width / 2 -
        secondChild.left +
        // Ensure about ~2rem of padding on the right.
        32
      const longerHalf = Math.max(leftHalfWidth, rightHalfWidth)

      // If longer half is longer than half the available space (i.e. the full width extends offscreen),
      // cannot fit 3 children.
      if (longerHalf > availableSpace / 2) {
        return
      }

      // Scroll.
      centerChildInContainer(scrollContainerNode, 2)
    })

  const move = useCallback(
    (forward: boolean) => {
      if (!scrollContainer.current) return

      const { children: allScrollChildren, clientWidth } =
        scrollContainer.current

      // Children bounding client rects are relative to the parent, so we just need the center of the non-scrolling width as opposed to scrollLeft + center.
      // i.e. Half the width of visible scrolling area.
      const containerCenter = clientWidth / 2

      // Get current index showing (child who surrounds the center, ie left edge is left of center and right edge is right of center).
      let currChildIndex
      for (
        // Start at first actual child since we pad the beginning with an empty div.
        currChildIndex = 1;
        // Stop if currChildIndex = last actual child = length - 2 since we pad the ending with an empty div.
        // If second to last one fails, assume last one.
        currChildIndex < allScrollChildren.length - 2;
        currChildIndex++
      ) {
        const childBounds =
          allScrollChildren[currChildIndex].getBoundingClientRect()
        // If child surrounds center of container, found.
        if (
          childBounds.left <= containerCenter &&
          childBounds.right >= containerCenter
        ) {
          break
        }
      }

      // Scroll in given direction.
      centerChildInContainer(
        scrollContainer.current,
        currChildIndex + (forward ? 1 : -1)
      )
    },
    [scrollContainer]
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

      {Children.count(children) > 1 && (
        <div className="flex flex-row gap-8 mt-5">
          <Button onClick={() => move(false)} bare>
            <IoChevronBack className="text-green" size={24} />
          </Button>

          <Button onClick={() => move(true)} bare>
            <IoChevronForward className="text-green" size={24} />
          </Button>
        </div>
      )}
    </div>
  )
}
