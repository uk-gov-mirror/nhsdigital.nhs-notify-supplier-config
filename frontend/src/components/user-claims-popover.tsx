"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { JwtClaims } from "@/utils/token-utils";
import {
  isPopoverDismissKey,
  isPopoverInteractionOutside,
} from "@/utils/user-claims-popover";

type UserClaimsPopoverProps = Readonly<{
  claims: Readonly<JwtClaims>;
  displayName: string;
  initialOpen?: boolean;
}>;

function formatClaimValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

export function UserClaimsPopover(props: Readonly<UserClaimsPopoverProps>) {
  const { claims, displayName, initialOpen = false } = props;
  const popoverReference = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(initialOpen);
  const popoverId = useId();
  const sortedClaims = Object.entries(claims).toSorted(([left], [right]) =>
    left.localeCompare(right),
  );

  useEffect(() => {
    if (!isOpen) {
      return () => {};
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        !isPopoverInteractionOutside(
          popoverReference.current as Pick<Node, "contains">,
          event.target,
        )
      ) {
        return;
      }

      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isPopoverDismissKey(event.key)) {
        return;
      }

      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="notify-user-claims" ref={popoverReference}>
      <button
        aria-controls={popoverId}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="notify-user-claims__trigger"
        onClick={() => {
          setIsOpen((currentValue) => !currentValue);
        }}
        type="button"
      >
        {displayName}
      </button>
      {isOpen ? (
        <div
          aria-label="Current user token claims"
          className="notify-user-claims__popover"
          id={popoverId}
          role="dialog"
        >
          <p className="notify-user-claims__title">Current user token claims</p>
          <dl className="notify-user-claims__list">
            {sortedClaims.map(([key, value]) => (
              <div className="notify-user-claims__row" key={key}>
                <dt>{key}</dt>
                <dd>{formatClaimValue(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </div>
  );
}
