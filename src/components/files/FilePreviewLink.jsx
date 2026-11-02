"use client";

import { useFilePreview } from "@/components/files/FilePreviewProvider";

/**
 * Anchor that previews supported uploads in-app while keeping normal
 * new-tab behaviour for unsupported files, external links, modifier clicks
 * and right-click / middle-click.
 */
export default function FilePreviewLink({
  href,
  name,
  children,
  onClick,
  ...props
}) {
  const { openFile } = useFilePreview();

  const handleClick = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    if (openFile({ url: href, name })) {
      event.preventDefault();
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      {...props}
    >
      {children}
    </a>
  );
}
