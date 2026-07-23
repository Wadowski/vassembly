import React from "react";
import { IconProps } from "./types";

export const FlashIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M17.848,11.306a1.023,1.023,0,0,0-.871-1.559H13.5v-9L6.152,12.689a1.022,1.022,0,0,0,.871,1.558H10.5v9Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
