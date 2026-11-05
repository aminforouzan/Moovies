import { createPortal } from "react-dom";

export function Portal({ children }: { children: React.ReactNode }) {
  let root = document.getElementById("portal-root");

  if (root === null) {
    root = document.createElement("div");
    root.setAttribute("id", "portal-root");
    document.querySelector("body")?.appendChild(root);
  }

  return createPortal(children, root);
}
