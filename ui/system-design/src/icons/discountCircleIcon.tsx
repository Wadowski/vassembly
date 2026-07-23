import React from "react";
import { IconProps } from "./types";

export const DiscountCircleIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    strokeWidth="1.5px"
  >
    <g>
      <circle
        cx="12"
        cy="12"
        r="11.25"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></circle>
      <line
        x1="8"
        y1="16"
        x2="16"
        y2="8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></line>
      <circle
        cx="8.75"
        cy="8.75"
        r="1.75"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></circle>
      <circle
        cx="15.25"
        cy="15.25"
        r="1.75"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></circle>
    </g>
  </svg>
);
