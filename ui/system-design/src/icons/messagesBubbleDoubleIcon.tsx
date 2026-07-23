import React from "react";
import { IconProps } from "./types";

export const MessagesBubbleDoubleIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M23.25,13.5A5.25,5.25,0,0,0,18,8.25H15a5.25,5.25,0,0,0,0,10.5h.75l4.5,4.5V18.226A5.239,5.239,0,0,0,23.25,13.5Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M6.75,12.75l-3,3V10.726A5.239,5.239,0,0,1,6,.75H9A5.252,5.252,0,0,1,14.032,4.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
