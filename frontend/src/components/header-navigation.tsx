"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getNavigationLinkForPath,
  getNavigationSectionForPath,
  navigationSections,
  overviewNavigationLink,
} from "@/components/navigation-links";

export function HeaderNavigation() {
  const pathname = usePathname();
  const navigationShellReference = useRef<HTMLDivElement>(null);
  const activeSection = useMemo(
    () => getNavigationSectionForPath(pathname),
    [pathname],
  );
  const activeLink = useMemo(
    () => getNavigationLinkForPath(pathname),
    [pathname],
  );
  const [expandedSectionLabel, setExpandedSectionLabel] = useState<string>();

  useEffect(() => {
    setExpandedSectionLabel(undefined);
  }, [pathname]);

  useEffect(() => {
    if (!expandedSectionLabel) {
      return () => {};
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (navigationShellReference.current?.contains(event.target as Node)) {
        return;
      }

      setExpandedSectionLabel(undefined);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setExpandedSectionLabel(undefined);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [expandedSectionLabel]);

  const expandedSection = navigationSections.find(
    (section) => section.label === expandedSectionLabel,
  );

  return (
    <>
      <div
        className="notify-header-navigation-shell"
        ref={navigationShellReference}
      >
        <nav
          className="nhsuk-header__navigation"
          aria-label="Primary navigation"
        >
          <div className="nhsuk-header__navigation-container nhsuk-width-container">
            <div className="notify-main-navigation">
              <Link
                className="nhsuk-header__navigation-link"
                data-current={pathname === "/"}
                href={overviewNavigationLink.href}
              >
                {overviewNavigationLink.label}
              </Link>
              {navigationSections.map((section) => {
                const isActive = activeSection?.label === section.label;
                const isExpanded = expandedSectionLabel === section.label;
                const panelId = `navigation-panel-${section.label.toLowerCase()}`;

                return (
                  <div
                    className="notify-main-navigation__item"
                    key={section.label}
                  >
                    <button
                      aria-controls={panelId}
                      aria-expanded={isExpanded}
                      aria-haspopup="dialog"
                      className="notify-main-navigation__button"
                      data-active={isActive}
                      onClick={() => {
                        setExpandedSectionLabel((currentLabel) =>
                          currentLabel === section.label
                            ? undefined
                            : section.label,
                        );
                      }}
                      type="button"
                    >
                      {section.label}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </nav>
        {expandedSection ? (
          <div
            className="notify-navigation-panel"
            id={`navigation-panel-${expandedSection.label.toLowerCase()}`}
            role="dialog"
          >
            <div className="nhsuk-width-container notify-navigation-panel__content">
              <div>
                <h2 className="notify-navigation-panel__title">
                  {expandedSection.label}
                </h2>
                <p className="notify-navigation-panel__description">
                  {expandedSection.description}
                </p>
              </div>
              <ul className="notify-navigation-panel__list">
                {expandedSection.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      className="notify-navigation-panel__link"
                      data-current={activeLink?.href === link.href}
                      href={link.href}
                      onClick={() => {
                        setExpandedSectionLabel(undefined);
                      }}
                    >
                      <span className="notify-navigation-panel__link-label">
                        {link.label}
                      </span>
                      <span className="notify-navigation-panel__link-description">
                        {link.description}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
      {activeSection ? (
        <nav
          className="notify-sub-navigation"
          aria-label={`${activeSection.label} navigation`}
        >
          <div className="nhsuk-width-container">
            <ul className="notify-sub-navigation__list">
              {activeSection.links.map((link) => (
                <li key={link.href}>
                  <Link
                    className="notify-sub-navigation__link"
                    data-current={activeLink?.href === link.href}
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      ) : null}
    </>
  );
}
