import React from "react";
import { IconProps } from "./types";

export const CursorIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M1.816,2.8l8.428,19.072a.75.75,0,0,0,1.411-.112l1.884-7.158a1.5,1.5,0,0,1,1.068-1.069l7.158-1.884a.75.75,0,0,0,.113-1.411L2.806,1.814A.75.75,0,0,0,1.816,2.8Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
