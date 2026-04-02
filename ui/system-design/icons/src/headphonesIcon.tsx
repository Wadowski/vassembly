import React from "react";
import { IconProps } from "./types";

export const HeadphonesIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    strokeWidth="1.5px"
  >
    <defs></defs>
    <title>headphones-1</title>
    <rect
      x="3.75"
      y="12.75"
      width="4.5"
      height="10.5"
      rx="1"
      ry="1"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></rect>
    <rect
      x="15.75"
      y="12.75"
      width="4.5"
      height="10.5"
      rx="1"
      ry="1"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></rect>
    <path
      d="M.75,18V12a11.25,11.25,0,0,1,22.5,0v6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
