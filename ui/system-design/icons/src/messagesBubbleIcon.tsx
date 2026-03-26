import React from "react";
import { IconProps } from "./types";

export const MessagesBubbleIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M12.75.75A10.485,10.485,0,0,0,3.833,16.775L.75,23.25l6.474-3.083A10.5,10.5,0,1,0,12.75.75Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
