export function isPopoverInteractionOutside(
  currentTarget: Pick<Node, "contains">,
  eventTarget: EventTarget | null,
) {
  return !currentTarget.contains(eventTarget as Node | null);
}

export function isPopoverDismissKey(key: string) {
  return key === "Escape";
}
