"use client";

import { useFilePreview } from "@/components/files/FilePreviewProvider";

/**
 * Inline image thumbnail that opens the in-app lightbox when tapped.
 * Unsupported image URLs fall back to the caller's normal onClick.
 */
export default function FilePreviewImage({
  src,
  alt,
  name,
  className = "",
  onClick,
  ...props
}) {
  const { openFile } = useFilePreview();

  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt || name || "Attachment"}
      className={`${className} cursor-pointer`}
      onClick={(event) => {
        onClick?.(event);
        const opened = openFile({ url: src, name: name || alt });
        if (!opened) {
          window.open(src, "_blank", "noopener,noreferrer");
        }
      }}
      {...props}
    />
  );
}
