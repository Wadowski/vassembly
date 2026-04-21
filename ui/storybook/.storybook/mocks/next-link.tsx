import type { AnchorHTMLAttributes, ReactNode } from 'react';

type NextLinkMockProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children?: ReactNode;
};

export default function Link({
  children,
  href,
  ...rest
}: NextLinkMockProps): JSX.Element {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
