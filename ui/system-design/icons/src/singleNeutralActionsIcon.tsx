import React from "react";
import { IconProps } from "./types";

export const SingleNeutralActionsIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M6.750 6.000 A5.250 5.250 0 1 0 17.250 6.000 A5.250 5.250 0 1 0 6.750 6.000 Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M2.25,23.25a9.75,9.75,0,0,1,19.5,0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
