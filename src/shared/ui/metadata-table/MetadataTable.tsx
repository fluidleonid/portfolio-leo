import React from "react";

export interface MetadataRow {
  label: string;
  value: string | React.ReactNode;
}

export interface MetadataTableProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of key-value rows to display */
  rows: MetadataRow[];
}

/**
 * 2-Column Skeuomorphic Metadata Table Component
 * 1:1 styled from client reference image (media_1793632031292_3ec897b6.png)
 *
 * Structure:
 * - Full-width border-t and border-b dividers (border-border-hardware / #383838)
 * - Left column: #8C8C8C (text-content-secondary) in Hauora 15/16px
 * - Right column: #CCCCCC (text-content-primary) in Hauora 15/16px
 * - Zero vertical borders, clean breathing room
 */
export const MetadataTable = React.forwardRef<HTMLDivElement, MetadataTableProps>(
  ({ rows, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`w-full flex flex-col border-t border-border-hardware select-none ${className}`}
        {...props}
      >
        {rows.map((row, idx) => (
          <div
            key={idx}
            className="flex w-full flex-row items-start justify-between border-b border-border-hardware py-[14px] sm:py-[16px] gap-[16px] sm:gap-[24px]"
          >
            {/* Left Column: Label in #8C8C8C */}
            <span className="w-[110px] sm:w-[140px] shrink-0 font-hauora text-[14px] font-normal leading-[20px] sm:leading-[22px] text-content-secondary">
              {row.label}
            </span>

            {/* Right Column: Value in #CCCCCC */}
            <span className="flex-1 min-w-0 font-hauora text-[14px] font-normal leading-[20px] sm:leading-[22px] text-content-primary whitespace-pre-line break-words">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
);

MetadataTable.displayName = "MetadataTable";
