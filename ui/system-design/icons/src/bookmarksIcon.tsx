import React from "react";
import { IconProps } from "./types";

export const BookmarksIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M15.6,2.032,21.967,8.4a1.5,1.5,0,0,1,0,2.121L10.3,22.184a.75.75,0,0,1-1.281-.53l-.31-6.364-6.364-.311a.75.75,0,0,1-.53-1.28L13.482,2.032A1.5,1.5,0,0,1,15.6,2.032Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
