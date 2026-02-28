import * as React from "react"

import { cn } from "#/lib/utils"

/** Wrapper for data tables: border, white background, overflow. Matches main user directory table. */
function TableContainer({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="table-container"
      className={cn(
        "w-full overflow-hidden border border-stone-200 bg-white",
        className
      )}
      {...props}
    />
  )
}

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b [&_tr]:border-stone-200", className)}
      {...props}
    />
  )
}

/** Header row with reference styling (bg-stone-50/80). Use for the first row inside TableHeader. */
function TableHeaderRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-header-row"
      className={cn(
        "border-stone-200 bg-stone-50/80 hover:bg-stone-50/80",
        className
      )}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("divide-y divide-stone-100 [&_tr:last-child]:border-b-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t border-stone-200 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-stone-200 bg-white transition-colors hover:bg-stone-50/50",
        className
      )}
      {...props}
    />
  )
}

interface TableHeadProps extends React.ComponentProps<"th"> {
  /** Optional icon shown to the left of the label (e.g. Lucide icon). Every table header should have an icon. */
  icon?: React.ReactNode
}

function TableHead({ className, icon, children, ...props }: TableHeadProps) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-9 border-r border-stone-200 px-3 py-1.5 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    >
      {icon != null ? (
        <div className="flex items-center gap-1.5">
          <span className="flex size-5 shrink-0 items-center justify-center border border-stone-300 bg-white text-stone-500 [&_svg]:size-3">
            {icon}
          </span>
          <span className="text-xs font-semibold text-stone-700">
            {children}
          </span>
        </div>
      ) : React.isValidElement(children) ? (
        children
      ) : (
        <span className="text-xs font-semibold text-stone-700">
          {children}
        </span>
      )}
    </th>
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "border-r border-stone-200 px-3 py-1.5 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableContainer,
  TableHeader,
  TableHeaderRow,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
