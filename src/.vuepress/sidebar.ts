import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    "",
    "portfolio",
    {
      text: "JavaScript",
      icon: "laptop-code",
      prefix: "Note/",
      children: "structure",
    },
    {
      text: "BAR",
      icon: "gamepad",
      prefix: "guide/bar/",
      children: [
        "",
        {
          text: "PVE 配置器",
          icon: "sliders",
          link: "https://godalone945.github.io/bar-mod/",
        },
        "tweak-capabilities",
        "baz",
      ],
    },
    {
      text: "其它文档",
      icon: "book",
      prefix: "guide/foo/",
      children: "structure",
    },
  ],
});
