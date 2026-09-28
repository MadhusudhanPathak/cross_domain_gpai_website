import { useEffect, useState } from "react";
import { Link } from "wouter";
import { site } from "../content/site";

type DoneInfo = { submissionId: string; copySent: boolean; email?: string; commitment?: string };

export function Done({ formId }: { formId: string }) {
  const [info, setInfo] = useState<DoneInfo | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`gpai:done:${formId}`);
      if (raw) setInfo(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, [formId]);

  const shortId = info?.submissionId ? info.submissionId.slice(0, 8) : undefined;
  const isDeclined = info?.commitment === "no";

  return (
    <div className="container container--narrow">
      <h1>Thank you</h1>
      <p>Your responses were received.</p>
      {shortId && <p className="field__help">Submission reference: {shortId}</p>}

      {!isDeclined && info && (
        <p>{info.copySent ? `A copy was sent to ${info.email}.` : "You did not ask for a copy of your responses."}</p>
      )}

      {!isDeclined ? (
        <p>
          We will be in touch by {site.replyByDate}. Questions? Contact{" "}
          <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
        </p>
      ) : (
        <p>
          Thank you for letting us know. If your availability changes, contact{" "}
          <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
        </p>
      )}

      <p>
        <Link href="/">Return home</Link>
      </p>
    </div>
  );
}
