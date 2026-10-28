import { useForecastData } from "../hooks/useForecastData.js";
import BriefingCard from "../components/BriefingCard.jsx";
import ForecastChart from "../components/ForecastChart.jsx";
import ForecastInsights from "../components/ForecastInsights.jsx";
import BuyerSurvey from "../components/BuyerSurvey.jsx";
import TimeMachine from "../components/TimeMachine.jsx";
import UncertaintyBand from "../components/UncertaintyBand.jsx";
import MetricsPanel from "../components/MetricsPanel.jsx";
import Loader from "../components/Loader.jsx";
import PageHeader from "../components/Pageheader.jsx";
import Reveal from "../components/Reveal.jsx";
import NavLink from "../components/Navlink.jsx";
import KnowledgeBasePage from "./KnowledgeBasePage.jsx";
import { clock, gw, mw, shortDate } from "../utils/format.js";

function HomePage({ metrics, briefing, forecast, loading }) {
  return (
    <main className="page-content home-page">
      <Reveal as="section" className="home-hero wrap section-arrival">
        <div className="hero-copy">
          <p className="eyebrow"><span className="status-dot" /> Wind intelligence for better decisions</p>
          <h1 className="hero-title">
            Know what the wind might do. Plan for <em>what it might not.</em>
          </h1>
          <p className="hero-intro">
            A clearer view of tomorrow’s wind forecast, the uncertainty behind it, and the margin
            worth keeping in your plans.
          </p>
          <div className="hero-actions">
            <NavLink to="briefing" className="btn btn-primary">
              Explore the daily briefing <span aria-hidden="true">↗</span>
            </NavLink>
            <NavLink to="method" className="text-link">How it works <span aria-hidden="true">→</span></NavLink>
          </div>
          <p className="hero-footnote">Built for energy teams who need context, not another number.</p>
        </div>

        <Reveal className="forecast-preview" delay={140}>
          <div className="preview-topline">
            <span className="preview-label">A look ahead</span>
            <span className="preview-live"><span className="status-dot" /> DAY-AHEAD</span>
          </div>
          {briefing ? (
            <>
              <p className="preview-date">Delivery day · {shortDate(briefing.date)}</p>
              <p className="preview-value">{gw(briefing.avg_forecast_mw)} <span>GW</span></p>
              <p className="preview-description">Expected average wind generation</p>
              <div className="preview-divider" />
              <div className="preview-buffer">
                <span>Suggested planning buffer</span>
                <strong>{mw(briefing.buffer_mw)} <small>MW</small></strong>
              </div>
              <p className="preview-note">Forecast context, made useful.</p>
            </>
          ) : <Loader />}
          <div className="preview-orbit orbit-one" />
          <div className="preview-orbit orbit-two" />
        </Reveal>
      </Reveal>

      <Reveal as="section" className="proof-section wrap section-arrival" aria-labelledby="proof-title">
        <div className="section-intro">
          <p className="eyebrow">A more considered forecast</p>
          <h2 id="proof-title">Make room for <em>uncertainty.</em></h2>
          <p>Confidence is not a footnote. It belongs alongside the forecast, where decisions are made.</p>
        </div>
        <div className="proof-stats">
          <Reveal className="proof-stat">
            <span className="stat-label">Typical forecast miss</span>
            <strong>{metrics ? `${mw(metrics.mae)} MW` : "—"}</strong>
            <span className="stat-detail">Measured against actual generation</span>
          </Reveal>
          <Reveal className="proof-stat" delay={100}>
            <span className="stat-label">Forecast detail</span>
            <strong>48 <small>points</small></strong>
            <span className="stat-detail">One view for every half-hour</span>
          </Reveal>
          <Reveal className="proof-stat" delay={200}>
            <span className="stat-label">Planning, with context</span>
            <strong>Day-ahead</strong>
            <span className="stat-detail">Uses the latest forecast before cutoff</span>
          </Reveal>
        </div>
      </Reveal>

      <Reveal as="section" className="forecast-story wrap section-arrival" id="forecast-story" aria-labelledby="story-title">
        <Reveal className="story-heading">
          <p className="eyebrow">01 / The day ahead</p>
          <h2 id="story-title">A forecast is a starting point. <em>Context is the difference.</em></h2>
          <p>See the headline, then follow the shape of the day—along with the range around every estimate.</p>
        </Reveal>
        {loading || !briefing || !forecast ? (
          <div className="panel story-loading"><Loader /></div>
        ) : (
          <div className="story-forecast-grid">
            <Reveal className="story-briefing">
              <BriefingCard briefing={briefing} />
              <div className="story-caption">
                <span className="caption-mark" aria-hidden="true">↗</span>
                <p>Forecast at the decision cutoff, with a planning buffer to keep uncertainty in view.</p>
              </div>
            </Reveal>
            <Reveal className="story-chart" delay={140}>
              <ForecastChart points={forecast.points} />
            </Reveal>
          </div>
        )}
        {!loading && forecast && (
          <Reveal delay={180}>
            <ForecastInsights points={forecast.points} />
          </Reveal>
        )}
      </Reveal>

      <Reveal as="section" className="confidence-story section-arrival" aria-labelledby="confidence-title">
        <div className="wrap confidence-inner">
          <Reveal className="story-heading">
            <p className="eyebrow">02 / Confidence, made tangible</p>
            <h2 id="confidence-title">How much buffer feels <em>right?</em></h2>
            <p>Explore the historical trade-off between a wider safety margin and the share of half-hours it would have covered.</p>
          </Reveal>
          <div className="accuracy-layout story-accuracy">
            <Reveal><UncertaintyBand coverage={metrics.coverage} suggested={briefing?.buffer_mw} /></Reveal>
            <Reveal delay={130}><MetricsPanel metrics={metrics} /></Reveal>
          </div>
          <Reveal className="accuracy-note">
            <span className="note-mark" aria-hidden="true">i</span>
            <p>Past performance helps put a forecast in context; it does not guarantee what the next day will bring.</p>
          </Reveal>
        </div>
      </Reveal>

      <Reveal as="section" className="journey-section wrap section-arrival" aria-labelledby="journey-title">
        <Reveal className="journey-heading">
          <p className="eyebrow">A clearer way to plan</p>
          <h2 id="journey-title">From forecast to <em>informed action.</em></h2>
        </Reveal>
        <div className="journey-cards">
          <Reveal as="article" className="journey-card unfold-card">
            <span className="card-index">01</span>
            <div className="unfold-body"><div className="unfold-inner">
              <h3>See the whole picture</h3>
              <p>Explore the half-hour forecast beside its likely range and actual outcome.</p>
              <NavLink to="briefing" className="text-link">Open the briefing <span aria-hidden="true">→</span></NavLink>
            </div></div>
          </Reveal>
          <Reveal as="article" className="journey-card unfold-card" delay={120}>
            <span className="card-index">02</span>
            <div className="unfold-body"><div className="unfold-inner">
              <h3>Understand the miss</h3>
              <p>Review forecast performance and the trade-off behind a larger safety buffer.</p>
              <NavLink to="accuracy" className="text-link">Explore accuracy <span aria-hidden="true">→</span></NavLink>
            </div></div>
          </Reveal>
          <Reveal as="article" className="journey-card unfold-card" delay={240}>
            <span className="card-index">03</span>
            <div className="unfold-body"><div className="unfold-inner">
              <h3>Know what’s underneath</h3>
              <p>Learn the forecast language, explore common buyer questions, and follow a simple learning path.</p>
              <NavLink to="knowledge" className="text-link">Visit the knowledge base <span aria-hidden="true">→</span></NavLink>
            </div></div>
          </Reveal>
        </div>
      </Reveal>

      <Reveal className="wrap survey-reveal">
        <BuyerSurvey />
      </Reveal>

      <Reveal as="section" className="closing-panel wrap section-arrival" aria-labelledby="buyer-case-title">
        <div className="closing-copy">
          <p className="eyebrow">For wind buyers and energy teams</p>
          <h2 id="buyer-case-title">Don’t just see the forecast. <em>See the risk around it.</em></h2>
          <p>
            Compare the day-ahead outlook with historical error and a suggested planning buffer,
            so your team can weigh uncertainty before making a buying decision.
          </p>
        </div>
        <div className="closing-evidence" aria-label="Forecast evidence">
          <div>
            <span>Typical forecast error</span>
            <strong>{metrics ? `${mw(metrics.mae)} MW` : "—"}</strong>
            <small>
              {metrics
                ? `Mean absolute error across ${metrics.n.toLocaleString("en-GB")} observed half-hours`
                : "Historical performance data"}
            </small>
          </div>
          <div>
            <span>Suggested planning buffer</span>
            <strong>{briefing ? `${mw(briefing.buffer_mw)} MW` : "—"}</strong>
            <small>
              {briefing
                ? `For the selected delivery day · ${shortDate(briefing.date)}`
                : "For the selected delivery day"}
            </small>
          </div>
          <div>
            <span>Forecast decision cutoff</span>
            <strong>{briefing ? clock(briefing.cutoff) : "—"}</strong>
            <small>Latest forecast published before the preceding day’s cutoff</small>
          </div>
        </div>
        <div className="closing-actions">
          <NavLink to="briefing" className="btn btn-primary">
            Review the daily briefing <span aria-hidden="true">↗</span>
          </NavLink>
          <NavLink to="accuracy" className="text-link">Check historical performance <span aria-hidden="true">→</span></NavLink>
        </div>
        <p className="closing-caveat">Historical performance is useful evidence, not a guarantee of future output.</p>
      </Reveal>

    </main>
  );
}

function BriefingPage({ dates, date, setDate, briefing, forecast, loading }) {
  return (
    <main className="page-content wrap">
      <PageHeader
        title="The daily *briefing*."
        intro="A calm, practical view of the day ahead. Move through past delivery days, then reveal what actually happened when you’re ready."
      />
      <Reveal className="briefing-controls">
        <TimeMachine
          dates={dates}
          date={date}
          onChange={setDate}
        />
      </Reveal>
      {loading || !briefing || !forecast ? (
        <div className="panel loading-panel"><Loader /></div>
      ) : (
        <>
          <Reveal><BriefingCard briefing={briefing} /></Reveal>
          <Reveal delay={60}>
            <ForecastInsights points={forecast.points} />
          </Reveal>
          <Reveal delay={90}><ForecastChart points={forecast.points} /></Reveal>
        </>
      )}
    </main>
  );
}

function AccuracyPage({ metrics, briefing }) {
  return (
    <main className="page-content wrap">
      <PageHeader
        title="Trust, with *evidence*."
        intro="A forecast is only useful when you can see how it tends to behave. Explore the error, its direction, and the buffer that covers it."
      />
      <div className="accuracy-layout">
        <Reveal><UncertaintyBand coverage={metrics.coverage} suggested={briefing?.buffer_mw} /></Reveal>
        <Reveal delay={100}><MetricsPanel metrics={metrics} /></Reveal>
      </div>
      <Reveal className="accuracy-note">
        <span className="note-mark" aria-hidden="true">i</span>
        <p>Past performance helps put a forecast in context; it does not guarantee what the next day will bring.</p>
      </Reveal>
    </main>
  );
}

function MethodPage() {
  return (
    <main className="page-content wrap">
      <PageHeader
        title="A forecast you can *understand*."
        intro="ForeSure keeps the assumptions visible. Here’s what goes into each briefing, and what the numbers are designed to tell you."
      />
      <section className="method-intro">
        <Reveal className="method-lead panel">
          <p className="eyebrow">Our approach</p>
          <h2>Useful context, without the <em>false certainty.</em></h2>
          <p>We surface the latest available day-ahead forecast, show its likely range, and compare it with actual generation after delivery.</p>
        </Reveal>
        <div className="method-steps">
          <Reveal as="article" className="method-step">
            <span className="step-number">01</span>
            <div><h3>Choose the forecast available at decision time</h3>
              <p>For each delivery day, we use the latest forecast published before the stated cutoff on the preceding day.</p>
            </div>
          </Reveal>
          <Reveal as="article" className="method-step" delay={100}>
            <span className="step-number">02</span>
            <div><h3>Show uncertainty beside the estimate</h3>
              <p>The shaded range communicates forecast uncertainty at each half-hour, so a single line does not imply more precision than it has.</p>
            </div>
          </Reveal>
          <Reveal as="article" className="method-step" delay={200}>
            <span className="step-number">03</span>
            <div><h3>Measure performance against actuals</h3>
              <p>Once actual generation is available, error metrics describe typical miss, larger misses, and any consistent high or low lean.</p>
            </div>
          </Reveal>
        </div>
      </section>
      <Reveal className="method-source">
        <div>
          <span className="source-label">Data source</span>
          <p>Wind data from Elexon BMRS (FUELHH and WINDFOR datasets).</p>
        </div>
        <div className="method-definition">
          <span className="source-label">Buyer statistics</span>
          <p>
            Daily energy estimates sum half-hour average power over 30-minute intervals. Daypart
            averages use UK local time. Ramp-direction agreement compares consecutive half-hour
            up/down changes where both observed changes are non-zero; peak timing difference is
            the absolute time between forecast and actual daily peaks. Output percentiles and the
            distribution chart describe the spread of half-hour values within that delivery day,
            not probabilistic confidence. RMSE gives larger misses more weight, while weighted
            absolute error is total absolute error divided by total actual generation.
          </p>
        </div>
      </Reveal>
    </main>
  );
}

export default function Dashboard({ route = "home" }) {
  const { dates, date, setDate, metrics, briefing, forecast, loading, error, usingMock } =
    useForecastData();
  if (route === "knowledge") return <KnowledgeBasePage />;

  if (error) {
    return (
      <main className="page-content wrap state">
        <p className="eyebrow">A moment, please</p>
        <h1>We couldn’t load the forecast data.</h1>
        <p className="muted">{error}. Check that the backend is running, then reload the page.</p>
      </main>
    );
  }

  if (!dates.length || !metrics) {
    return <main className="page-content wrap state"><Loader /></main>;
  }

  return (
    <>
      {usingMock && (
        <p className="notice wrap" role="note">
          You’re viewing generated demo data because the backend isn’t reachable.
        </p>
      )}
      {route === "briefing" && (
        <BriefingPage
          dates={dates}
          date={date}
          setDate={setDate}
          briefing={briefing}
          forecast={forecast}
          loading={loading}
        />
      )}
      {route === "accuracy" && <AccuracyPage metrics={metrics} briefing={briefing} />}
      {route === "method" && <MethodPage />}
      {route === "home" && (
        <HomePage metrics={metrics} briefing={briefing} forecast={forecast} loading={loading} />
      )}
    </>
  );
}
