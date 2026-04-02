import React from "react";
import { IconProps } from "./types";

export const FlagTriangleIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M5.625,12.75,17.484,8.121a1.5,1.5,0,0,0,0-2.742L5.625.75v22.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
