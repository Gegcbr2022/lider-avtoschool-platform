import Image from "next/image";
import Link from "next/link";
import type { MouseEventHandler } from "react";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  priority?: boolean;
};

export function BrandLogo({ className = "", imageClassName = "", onClick, priority = false }: BrandLogoProps) {
  return (
    <Link
      href="/"
      aria-label="На головну сторінку автошколи Лідер"
      onClick={onClick}
      className={`inline-flex min-w-0 items-center ${className}`}
    >
      <Image
        src="/logo.png"
        alt="Логотип автошколи Лідер"
        width={167}
        height={72}
        priority={priority}
        sizes="(max-width: 640px) 96px, 120px"
        className={`h-auto w-24 object-contain sm:w-[120px] ${imageClassName}`}
      />
    </Link>
  );
}
