import SplitHeading from "./Splitheading.jsx";
import Reveal from "./Reveal.jsx";

export default function PageHeader({ title, intro }) {
  return (
    <section className="page-header">
      <div className="wrap">
        <SplitHeading as="h1" className="display" text={title} />
        <Reveal as="p" className="lede" delay={450}>
          {intro}
        </Reveal>
      </div>
    </section>
  );
}