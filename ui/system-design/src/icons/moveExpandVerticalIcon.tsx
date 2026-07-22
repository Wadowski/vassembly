import React from "react";
import { IconProps } from "./types";

export const MoveExpandVerticalIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M3.75,15l7.72,7.72a.751.751,0,0,0,1.06,0L20.25,15"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M3.75,9l7.72-7.72a.749.749,0,0,1,1.06,0L20.25,9"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
