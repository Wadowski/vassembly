import React from "react";
import { IconProps } from "./types";

export const TagsIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M1.135,2.634V8.892a3,3,0,0,0,.879,2.121l11.63,11.63a.75.75,0,0,0,1.266-.383l1.225-6.126,6.126-1.225a.75.75,0,0,0,.383-1.266L11.014,2.013a3,3,0,0,0-2.121-.879H2.635A1.5,1.5,0,0,0,1.135,2.634Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
    <path
      d="M4.885 6.384 A1.500 1.500 0 1 0 7.885 6.384 A1.500 1.500 0 1 0 4.885 6.384 Z"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
