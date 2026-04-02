import React from "react";
import { IconProps } from "./types";

export const LoveItIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M12,21.844l-9.588-10A5.672,5.672,0,0,1,1.349,5.293h0a5.673,5.673,0,0,1,9.085-1.474L12,5.384l1.566-1.565a5.673,5.673,0,0,1,9.085,1.474h0a5.673,5.673,0,0,1-1.062,6.548Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
