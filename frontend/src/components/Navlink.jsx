import { useRouter } from "../hooks/Usehashroute.js";

export default function NavLink({ to, className = "", children, ...rest }) {
  const { route, go } = useRouter();
  return (
    <a
      href={`#/${to}`}
      className={className}
      aria-current={route === to ? "page" : undefined}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        go(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}