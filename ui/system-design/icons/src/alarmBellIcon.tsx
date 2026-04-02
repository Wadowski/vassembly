import React from "react";
import { IconProps } from "./types";

export const AlarmBellIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M10,21.75a2.087,2.087,0,0,0,4.005,0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M12 3L12 0.75"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M12,3a7.5,7.5,0,0,1,7.5,7.5c0,7.046,1.5,8.25,1.5,8.25H3s1.5-1.916,1.5-8.25A7.5,7.5,0,0,1,12,3Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
