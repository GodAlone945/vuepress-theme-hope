import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  "/Note/",
  {
    text: "BAR",
    icon: "gamepad",
    prefix: "/guide/bar/",
    children: [
      { text: "PVE 配置器", icon: "sliders", link: "/bar-mod/" },
      { text: "Tweak 能力清单", icon: "list-check", link: "tweak-capabilities" },
      "baz",
    ],
  },
  {
    text: "指南",
    icon: "lightbulb",
    prefix: "/guide/",
    children: [
      {
        text: "Bar",
        icon: "lightbulb",
        prefix: "bar/",
        children: [
          { text: "PVE 配置器", icon: "sliders", link: "/bar-mod/" },
          { text: "Tweak 能力清单", icon: "list-check", link: "tweak-capabilities" },
          "baz",
        ],
      },
      {
        text: "Foo",
        icon: "lightbulb",
        prefix: "foo/",
        children: ["ray", { text: "...", icon: "ellipsis", link: "" }],
      },
    ],
  },
  {
    text: "V2 文档",
    icon: "book",
    link: "https://theme-hope.vuejs.press/zh/",
  },
]);
