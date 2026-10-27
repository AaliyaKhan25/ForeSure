import { useEffect, useState } from "react";

const STORAGE_KEY = "foresure-buyer-survey-v1";
const OPTIONS = [
  "Spot price and market exposure",
  "Forecast accuracy by lead time",
  "Low-wind or shortfall risk",
  "Comparing wind with our demand or portfolio",
  "Something else",
];

function isSurveyResponse(value) {
  return value && OPTIONS.includes(value.choice) && typeof value.submittedAt === "string";
}

export default function BuyerSurvey() {
  const [choice, setChoice] = useState("");
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const response = JSON.parse(stored);
        if (!isSurveyResponse(response)) {
          window.localStorage.removeItem(STORAGE_KEY);
          setMessage("The saved response was invalid and has been cleared. Please choose again.");
        } else {
          setChoice(response.choice);
          setSaved(true);
        }
      }
      setStorageReady(true);
    } catch (error) {
      setMessage(`We couldn’t read this browser’s saved response: ${error.message}`);
    }
  }, []);

  function submit(event) {
    event.preventDefault();
    if (!choice) {
      setMessage("Choose the insight that would help your team most.");
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ choice, submittedAt: new Date().toISOString() })
      );
      setSaved(true);
      setMessage("Thanks — your response is saved in this browser.");
    } catch (error) {
      setMessage(`We couldn’t save your response in this browser: ${error.message}`);
    }
  }

  function editResponse() {
    setSaved(false);
    setMessage("");
  }

  return (
    <section className="buyer-survey" aria-labelledby="survey-title">
      <div className="survey-copy">
        <p className="eyebrow">Help shape what comes next</p>
        <h2 id="survey-title">What would help your team make better wind-buying decisions?</h2>
        <p>Pick the one insight you’d value most in a future version of ForeSure.</p>
      </div>
      {saved ? (
        <div className="survey-thanks" role="status">
          <span className="survey-check" aria-hidden="true">✓</span>
          <div>
            <strong>Thanks for sharing.</strong>
            <p>Your choice: {choice}</p>
            <button type="button" className="survey-edit" onClick={editResponse}>Change response</button>
          </div>
        </div>
      ) : (
        <form className="survey-form" onSubmit={submit}>
          <fieldset disabled={!storageReady}>
            <legend className="sr-only">Choose the most useful future insight</legend>
            {OPTIONS.map((option) => (
              <label className="survey-option" key={option}>
                <input
                  type="radio"
                  name="buyer-insight"
                  value={option}
                  checked={choice === option}
                  onChange={() => {
                    setChoice(option);
                    setMessage("");
                  }}
                />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>
          <div className="survey-submit-row">
            <button className="btn btn-primary" type="submit" disabled={!storageReady}>
              Save response <span aria-hidden="true">→</span>
            </button>
            <p className="survey-privacy">Saved only in this browser; it is not sent to ForeSure or your company.</p>
          </div>
          {message && <p className="survey-message" role="status">{message}</p>}
        </form>
      )}
    </section>
  );
}
