import React from "react";
import { IconProps } from "./types";

export const ScrollVerticalIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M9.750 11.998 A2.250 2.250 0 1 0 14.250 11.998 A2.250 2.250 0 1 0 9.750 11.998 Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M6,6.308l5.25-5.25a1.061,1.061,0,0,1,1.5,0L18,6.308"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M18,17.687l-5.25,5.25a1.061,1.061,0,0,1-1.5,0L6,17.687"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
