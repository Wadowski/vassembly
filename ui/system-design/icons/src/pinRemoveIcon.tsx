import React from "react";
import { IconProps } from "./types";

export const PinRemoveIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M8.574,21.807C6.3,18.933,1.5,12.474,1.5,9a8.25,8.25,0,0,1,16.465-.768"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M10.500 17.250 A6.000 6.000 0 1 0 22.500 17.250 A6.000 6.000 0 1 0 10.500 17.250 Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M13.5 17.25L19.5 17.25"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
