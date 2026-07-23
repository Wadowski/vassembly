import React from "react";
import { IconProps } from "./types";

export const SocialProfileAvatarIcon = ({ className, style }: IconProps) => (
  <svg
    style={style}
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    strokeWidth="1.5"
  >
    <path
      d="M4.5,23.25V16.985A9.365,9.365,0,0,1,10.875.75c7.5,0,8.823,6.5,11.625,13.5h-3v3a3,3,0,0,1-3,3H15v3"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    ></path>
  </svg>
);
