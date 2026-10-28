import NavLink from "../components/Navlink.jsx";
import PageHeader from "../components/Pageheader.jsx";
import Reveal from "../components/Reveal.jsx";

const GLOSSARY = [
  {
    term: "Forecast",
    definition: "The expected average wind generation for a half-hour, selected using information available before the decision cutoff.",
  },
  {
    term: "Actual generation",
    definition: "The observed wind generation reported for a completed half-hour. It is shown separately from the forecast; if the observation is missing, ForeSure labels it unavailable.",
  },
  {
    term: "Decision cutoff",
    definition: "The latest publication time used for the day-ahead forecast: 09:00 UK local time on the day before delivery, unless configured otherwise.",
  },
  {
    term: "Likely range",
    definition: "A historical error range around each forecast, estimated from the 10th and 90th percentiles of past errors for that UK local hour. It describes past errors, not a guarantee or a probability for the next delivery day.",
  },
  {
    term: "Mean absolute error (MAE)",
    definition: "The average size of forecast errors without regard to direction. Lower MAE means smaller typical misses in the measured sample.",
  },
  {
    term: "Root mean square error (RMSE)",
    definition: "An error measure that squares each miss before averaging, so larger misses have more influence than they do in MAE.",
  },
  {
    term: "Forecast bias",
    definition: "The average signed difference between forecast and actual. A positive bias means forecasts were higher than observed generation on average; a negative bias means lower.",
  },
  {
    term: "Planning buffer",
    definition: "A suggested margin based on the 80th percentile of historical absolute forecast errors. Use it as decision context, not as a guaranteed reserve requirement.",
  },
  {
    term: "Buffer coverage",
    definition: "The share of observed half-hours whose absolute forecast error was no larger than a selected buffer, measured on the historical sample.",
  },
];

const LEARNING_STEPS = [
  {
    number: "01",
    title: "Read the day-ahead view",
    text: "Start with the expected average, delivery date, and cutoff. The cutoff tells you which forecast publication was available at decision time.",
    link: "briefing",
    linkText: "Open the briefing",
  },
  {
    number: "02",
    title: "Put uncertainty beside the number",
    text: "Use the half-hour range and suggested buffer to see where the outlook has more room for error. Neither turns a forecast into a certainty.",
    link: "method",
    linkText: "Read the methodology",
  },
  {
    number: "03",
    title: "Compare with observed output",
    text: "Actual generation appears alongside the forecast when source observations are available. Then use historical error and buffer coverage to understand performance.",
    link: "accuracy",
    linkText: "Explore historical accuracy",
  },
];

const FAQS = [
  {
    question: "Why might actual generation be missing?",
    answer: "Observed values can be absent while the source data is incomplete or for periods that have not yet been reported. ForeSure leaves those periods unavailable rather than substituting a forecast and presenting it as an observation.",
  },
  {
    question: "Does the likely range mean the outcome has an 80% chance of falling inside it?",
    answer: "No. The range is estimated from historical forecast errors by local hour. It is not a calibrated probability statement, and future performance can differ from the historical sample.",
  },
  {
    question: "How should I interpret a positive forecast bias?",
    answer: "Bias is forecast minus actual. Positive values mean the forecasts tended to be higher than observed generation in the periods measured; negative values mean they tended to be lower.",
  },
  {
    question: "Does the suggested buffer tell me how much energy to buy?",
    answer: "No. It summarizes a historical error margin and is intended as planning context. Buying decisions also depend on your demand, contract, market exposure, assets, and risk policy.",
  },
  {
    question: "Which data does ForeSure use?",
    answer: "The current data pipeline uses Elexon BMRS WINDFOR wind forecasts and FUELHH wind generation observations. The Method page explains the cutoff and calculations used in this dashboard.",
  },
];

function KnowledgeSectionHeading({ eyebrow, title, description, id }) {
  return (
    <div className="knowledge-section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

export default function KnowledgeBasePage() {
  return (
    <main className="page-content wrap knowledge-page">
      <PageHeader
        title="The wind buyer’s *knowledge base*."
        intro="A practical guide to reading forecasts, understanding uncertainty, and comparing predictions with observed generation."
      />

      <Reveal as="section" className="knowledge-welcome" aria-labelledby="knowledge-welcome-title">
        <div>
          <p className="eyebrow">Start here</p>
          <h2 id="knowledge-welcome-title">Forecasts are estimates. <em>Evidence makes them useful.</em></h2>
          <p>
            ForeSure keeps the day-ahead forecast and actual generation distinct. Actuals are
            always shown when available; missing observations are identified instead of guessed.
          </p>
        </div>
        <NavLink to="briefing" className="btn btn-primary">
          Explore a delivery day <span aria-hidden="true">↗</span>
        </NavLink>
      </Reveal>

      <section className="knowledge-learning" aria-labelledby="learning-title">
        <KnowledgeSectionHeading
          eyebrow="A short learning path"
          title="Three steps from outlook to informed review."
          description="Follow the links in order, or jump straight to the topic your team needs."
          id="learning-title"
        />
        <div className="learning-cards">
          {LEARNING_STEPS.map((step) => (
            <Reveal as="article" className="learning-card" key={step.number}>
              <span className="card-index">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              <NavLink to={step.link} className="text-link">
                {step.linkText} <span aria-hidden="true">→</span>
              </NavLink>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="knowledge-glossary" id="glossary" aria-labelledby="glossary-title">
        <KnowledgeSectionHeading
          eyebrow="Glossary"
          title="The numbers, in plain language."
          description="These definitions describe the calculations and labels used in ForeSure."
          id="glossary-title"
        />
        <dl className="glossary-list">
          {GLOSSARY.map(({ term, definition }, index) => (
            <Reveal as="div" className="glossary-item" key={term} delay={index * 35}>
              <dt>{term}</dt>
              <dd>{definition}</dd>
            </Reveal>
          ))}
        </dl>
      </section>

      <section className="knowledge-faq" id="faq" aria-labelledby="faq-title">
        <KnowledgeSectionHeading
          eyebrow="Frequently asked questions"
          title="A few useful clarifications."
          id="faq-title"
        />
        <div className="faq-list">
          {FAQS.map(({ question, answer }) => (
            <details className="faq-item" key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <Reveal as="aside" className="knowledge-source" aria-label="Data source">
        <div>
          <span className="source-label">Data source</span>
          <p>
            Forecasts and observations come from Elexon BMRS datasets
            {" "}<a href="https://data.elexon.co.uk/bmrs/api/v1" target="_blank" rel="noreferrer">WINDFOR and FUELHH</a>.
            See the <NavLink to="method">ForeSure methodology</NavLink> for the decision cutoff and calculation details.
          </p>
        </div>
        <NavLink to="accuracy" className="text-link">
          Put the metrics in context <span aria-hidden="true">→</span>
        </NavLink>
      </Reveal>
    </main>
  );
}
