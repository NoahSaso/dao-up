import cn from "classnames"
import { FunctionComponent } from "react"
import { DragSourceMonitor, useDrag, useDrop } from "react-dnd"
import { FieldArrayWithId } from "react-hook-form"
import { IoClose } from "react-icons/io5"

import { Button } from "@/components"

interface ImageUrlDragObject {
  index: number
}
interface ImageUrlDropResult {
  index: number
}

interface ImageUrlFieldProps {
  index: number
  field: FieldArrayWithId<BaseCampaignInfo, "_descriptionImageUrls", "id">
  remove: () => void
  move: (from: number, to: number) => void
}

export const ImageUrlField: FunctionComponent<ImageUrlFieldProps> = ({
  index,
  field,
  remove,
  move,
}) => {
  const [{ isDragging }, dragRef] = useDrag<
    ImageUrlDragObject,
    ImageUrlDropResult,
    { isDragging: boolean }
  >(
    () => ({
      type: "imageUrl",
      item: { index },
      allowedDropEffect: "move",
      end: (item, monitor) => {
        const dropResult = monitor.getDropResult()
        if (!item || !dropResult) return

        const from = item.index

        let to = dropResult.index
        // If moving an item deeper into array (from lower to higher index),
        // decrement index due to the shift caused by this removal.
        if (to > from) to--

        move(from, to)
      },
      collect: (monitor: DragSourceMonitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [index]
  )

  return (
    <div className="relative cursor-move" ref={dragRef}>
      <div className="flex flex-row justify-between items-start pl-5 py-3 pr-0">
        <h3
          className={cn("flex-1 text-green", {
            "opacity-50": isDragging,
          })}
        >
          {field.url}
        </h3>
      </div>

      {/* Dropzones for before and after this field. */}
      <ImageUrlDropzone
        index={index}
        className="absolute -top-[1px] left-0 right-0 h-[calc(50%+1px)] border-light"
        hoverClassName="border-t -left-5"
      />
      <ImageUrlDropzone
        index={index + 1}
        className="absolute bottom-0 left-0 right-0 h-1/2 border-b border-light"
        hoverClassName="-left-5"
      />

      {/* Remove button */}
      <div className="absolute top-0 bottom-0 right-0 flex flex-col justify-center items-center">
        <Button onClick={remove} bare>
          <IoClose size={24} />
        </Button>
      </div>
    </div>
  )
}

interface ImageUrlDropzoneProps {
  index: number
  className?: string
  hoverClassName?: string
}

export const ImageUrlDropzone: FunctionComponent<ImageUrlDropzoneProps> = ({
  index,
  className,
  hoverClassName,
}) => {
  const [{ hovering }, dropRef] = useDrop<
    ImageUrlDragObject,
    ImageUrlDropResult,
    { hovering: boolean }
  >(
    () => ({
      accept: "imageUrl",
      allowedDropEffect: "move",
      drop: () => ({ index }),
      collect: (monitor: any) => ({
        hovering: monitor.isOver(),
      }),
    }),
    [index]
  )

  return (
    <div
      className={cn(
        hoverClassName
          ? {
              [hoverClassName]: hovering,
            }
          : "",
        className
      )}
      ref={dropRef}
    ></div>
  )
}
