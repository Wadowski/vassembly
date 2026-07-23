import React from "react";
import { IconProps } from "./types";

export const LockIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    strokeWidth="1.5px"
  >
    <defs></defs>
    <title>lock-6</title>
    <rect
      x="3.75"
      y="9.75"
      width="16.5"
      height="13.5"
      rx="1.5"
      ry="1.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></rect>
    <path
      d="M6.75,9.75V6a5.25,5.25,0,0,1,10.5,0V9.75"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <circle
      cx="12"
      cy="16.5"
      r="2.25"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></circle>
  </svg>
);
