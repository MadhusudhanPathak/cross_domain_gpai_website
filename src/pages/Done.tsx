import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ContactLink } from "../components/ContactLink";
import { site } from "../content/site";
import { loadDoneInfo, type DoneInfo } from "../services/storage";

/** Confirmation page. Details come from sessionStorage, so a direct visit shows only the generic message. */
export function Done({ formId }: { formId: string }) {
  const [info, setInfo] = useState<DoneInfo | null>(null);

  useEffect(() => {
    setInfo(loadDoneInfo(formId));
  }, [formId]);

  const shortId = info?.submissionId.slice(0, 8);
  const isDeclined = info?.commitment === "no";

  return (
    <div className="container container--narrow">
      <h1>Thank you</h1>
      <p>Your responses were received.</p>
      {shortId && <p className="field__help">Submission reference: {shortId}</p>}

      {!isDeclined && info && (
        <p>{info.copySent ? `A copy was sent to ${info.email}.` : "You did not ask for a copy of your responses."}</p>
      )}

      {isDeclined ? (
        <p>
          Thank you for letting us know. If your availability changes, contact <ContactLink />.
        </p>
      ) : (
        <p>
          We will be in touch by {site.replyByDate}. Questions? Contact <ContactLink />.
        </p>
      )}

      <p>
        <Link href="/">Return home</Link>
      </p>
    </div>
  );
}
