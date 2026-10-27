import { useReveal } from "../hooks/Usereveal.js";

// Wraps anything; it jumps up into place when scrolled into view.
export default function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...rest }) {
  const ref = useReveal();
  return (
    <Tag ref={ref} className={`reveal ${className}`.trim()} style={{ "--d": `${delay}ms` }} {...rest}>
      {children}
    </Tag>
  );
}