import { Fragment } from "react";
import { useReveal } from "../hooks/Usereveal.js";

// Words jump up one by one. Wrap words in *asterisks* to set them in italic emphasis.
function parse(text) {
  const words = [];
  text.split("*").forEach((segment, i) => {
    segment
      .split(" ")
      .filter(Boolean)
      .forEach((w) => words.push({ w, em: i % 2 === 1 }));
  });
  return words;
}

export default function SplitHeading({ as: Tag = "h2", text, className = "", delay = 0 }) {
  const ref = useReveal();
  const words = parse(text);

  return (
    <Tag ref={ref} className={`split ${className}`.trim()} style={{ "--d": `${delay}ms` }}>
      <span className="sr-only">{text.replaceAll("*", "")}</span>
      <span aria-hidden="true">
        {words.map((x, i) => (
          <Fragment key={i}>
            <span className="word-mask">
            <span
              className={x.em ? "word em" : "word"}
              style={{ "--i": i, transitionDelay: `${delay + i * 32}ms` }}
            >
              {x.w}
            </span>
            </span>{" "}
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}