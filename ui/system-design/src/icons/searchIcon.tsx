import React from "react";
import { IconProps } from "./types";

export const SearchIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M0.750 9.812 A9.063 9.063 0 1 0 18.876 9.812 A9.063 9.063 0 1 0 0.750 9.812 Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="translate(-3.056 4.62) rotate(-23.025)"
    ></path>
    <path
      d="M16.221 16.22L23.25 23.25"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
