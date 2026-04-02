import React from "react";
import { IconProps } from "./types";

export const HouseIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M3.753,13.944v8.25h6v-6a1.5,1.5,0,0,1,1.5-1.5h1.5a1.5,1.5,0,0,1,1.5,1.5v6h6v-8.25"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M.753,12.444,10.942,2.255a1.5,1.5,0,0,1,2.122,0L23.253,12.444"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
