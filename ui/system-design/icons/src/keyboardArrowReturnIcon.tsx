import React from "react";
import { IconProps } from "./types";

export const KeyboardArrowReturnIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M5.25 21.747L0.75 17.247 5.25 12.747"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M.75,17.247h15a7.5,7.5,0,0,0,0-15h-6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
