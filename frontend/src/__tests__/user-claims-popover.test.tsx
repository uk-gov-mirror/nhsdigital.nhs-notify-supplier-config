import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { UserClaimsPopover } from "@/components/user-claims-popover";
import {
  isPopoverDismissKey,
  isPopoverInteractionOutside,
} from "@/utils/user-claims-popover";

describe("UserClaimsPopover", () => {
  it("renders token claims when the popover is open", () => {
    const markup = renderToStaticMarkup(
      createElement(UserClaimsPopover, {
        claims: {
          "cognito:groups": ["Admins"],
          email: "alex@example.nhs.uk",
          sub: "user-123",
        },
        displayName: "Alex Morgan",
        initialOpen: true,
      }),
    );

    expect(markup).toContain("Current user token claims");
    expect(markup).toContain("Alex Morgan");
    expect(markup).toContain("email");
    expect(markup).toContain("alex@example.nhs.uk");
    expect(markup).toContain("[&quot;Admins&quot;]");
  });

  it("does not render token claims when the popover is closed", () => {
    const markup = renderToStaticMarkup(
      createElement(UserClaimsPopover, {
        claims: { email: "alex@example.nhs.uk" },
        displayName: "Alex Morgan",
      }),
    );

    expect(markup).toContain("Alex Morgan");
    expect(markup).not.toContain("Current user token claims");
  });

  it("recognises interactions inside the popover container", () => {
    const insideTarget = {} as Node;

    expect(
      isPopoverInteractionOutside(
        {
          contains: (node) => [insideTarget].includes(node as Node),
        },
        insideTarget as unknown as EventTarget,
      ),
    ).toBe(false);
  });

  it("recognises interactions outside the popover container", () => {
    const outsideTarget = {} as Node;

    expect(
      isPopoverInteractionOutside(
        {
          contains: () => false,
        },
        outsideTarget as unknown as EventTarget,
      ),
    ).toBe(true);
  });

  it("closes the popover when Escape is pressed", () => {
    expect(isPopoverDismissKey("Escape")).toBe(true);
    expect(isPopoverDismissKey("Enter")).toBe(false);
  });
});
