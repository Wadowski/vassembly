import React from "react";
import { IconProps } from "./types";

export const MessagesBubbleSquareIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M21.75,18.75H11.25l-6,4.5v-4.5h-3a1.5,1.5,0,0,1-1.5-1.5v-15A1.5,1.5,0,0,1,2.25.75h19.5a1.5,1.5,0,0,1,1.5,1.5v15A1.5,1.5,0,0,1,21.75,18.75Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
