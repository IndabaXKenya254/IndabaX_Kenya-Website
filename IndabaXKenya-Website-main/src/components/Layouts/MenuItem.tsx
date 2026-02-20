"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MenuItemProps {
  label: string;
  link: string;
  submenu?: { label: string; link: string }[];
}

const MenuItem: React.FC<MenuItemProps> = ({ label, link, submenu }) => {
  const pathname = usePathname();
  // Check if current path matches exactly, or if it's the home page
  const isActive = pathname === link || (link === "/" && pathname === "/");

  if (submenu) {
    // Check if any submenu item is active to highlight parent
    const hasActiveSubmenu = submenu.some((subItem) => pathname === subItem.link);

    return (
      <li className="nav-item" key={label}>
        <Link
          href={link}
          className={`nav-link ${hasActiveSubmenu ? "active" : ""}`}
          onClick={(e) => e.preventDefault()}
        >
          {label} <i className="icofont-thin-down d-none d-xl-inline"></i>
        </Link>

        <ul className="dropdown-menu">
          {submenu.map((subItem) => {
            const isSubActive = pathname === subItem.link;
            return (
              <li className="nav-item" key={subItem.label}>
                <Link
                  href={subItem.link}
                  className={`nav-link ${isSubActive ? "active" : ""}`}
                >
                  {subItem.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </li>
    );
  }

  return (
    <li className="nav-item" key={label}>
      <Link href={link} className={`nav-link ${isActive ? "active" : ""}`}>
        {label}
      </Link>
    </li>
  );
};

export default MenuItem;
