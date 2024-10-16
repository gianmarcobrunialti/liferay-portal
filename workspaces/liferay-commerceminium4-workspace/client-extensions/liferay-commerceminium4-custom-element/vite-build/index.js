import { VerticalNav as l } from "@clayui/core";
import c from "react";
function f(m) {
  return m.length ? m.map((a) => ({
    active: (a == null ? void 0 : a.active) ?? !1,
    href: a == null ? void 0 : a.href,
    id: a == null ? void 0 : a.id,
    items: (a == null ? void 0 : a.items) ?? [],
    label: a == null ? void 0 : a.label
  })) : {};
}
function u({
  entries: m,
  spritemap: a
}) {
  return /* @__PURE__ */ c.createElement(
    l,
    {
      className: "minium-primary-navigation",
      items: f(m),
      spritemap: a
    },
    (i) => /* @__PURE__ */ c.createElement(
      l.Item,
      {
        active: i.active,
        href: i.href,
        items: i.items,
        key: i.id
      },
      i.label
    )
  );
}
export {
  u as default
};
