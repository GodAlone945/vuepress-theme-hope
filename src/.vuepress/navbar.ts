import { navbar } from "vuepress-theme-hope";

export default navbar([
  {
    text: "项目主页",
    icon: "house",
    link: "/",
  },
  {
    text: "JavaScript",
    icon: "laptop-code",
    link: "/Note/",
  },
  {
    text: "BAR",
    icon: "gamepad",
    prefix: "/guide/bar/",
    children: [
      { text: "BAR 首页", icon: "house", link: "" },
      {
        text: "PVE 配置器",
        icon: "sliders",
        link: "https://godalone945.github.io/bar-mod/",
      },
      {
        text: "Tweak 能力清单",
        icon: "list-check",
        link: "tweak-capabilities",
      },
      "baz",
    ],
  },
]);
