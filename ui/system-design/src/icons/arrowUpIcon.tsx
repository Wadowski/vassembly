import React from "react";
import { IconProps } from "./types";

export const ArrowUpIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M.75,17.189,11.47,6.47a.749.749,0,0,1,1.06,0L23.25,17.189"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
