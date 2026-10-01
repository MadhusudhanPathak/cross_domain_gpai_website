import { ContactLink } from "../components/ContactLink";
import { site } from "../content/site";

export function Privacy() {
  return (
    <div className="container">
      <h1>Privacy and data notice</h1>

      <h2>Who is responsible for the data</h2>
      <p>
        {site.dataController} is responsible for this study. Contact <ContactLink /> with any questions or requests about
        your data.
      </p>

      <h2>What we collect</h2>
      <p>
        Form answers (including your name, email, role, expertise and availability), your consent record, and, for
        panellists who take part in the final stage, the recording and transcript of the 15-minute call.
      </p>

      <h2>Why we collect it</h2>
      <p>We use this information to run the expert panel and produce the resulting research paper.</p>

      <h2>Legal basis</h2>
      <p>We process your data on the basis of your consent, which you may withdraw at any time.</p>

      <h2>Who sees it</h2>
      <p>
        Only the named research team sees identifiable responses. Other panellists see only anonymised, aggregated round
        summaries. The paper's appendix lists names and short profiles only for participants who consent to it.
      </p>

      <h2>Where it is stored</h2>
      <p>
        Responses are stored in a Google Sheet held in the research team's Google account. This website is static and
        stores nothing on a server; the only data sent off your device goes to that Google Sheet. If the call is
        transcribed with a third-party tool, that tool is {site.transcriptionTool}.
      </p>

      <h2>Retention</h2>
      <p>We keep your data for {site.retentionPeriod}.</p>

      <h2>Your rights</h2>
      <p>
        You may ask to access, correct or delete your data, or withdraw from the study, at any time by contacting <ContactLink />.
      </p>

      <h2>Cookies and tracking</h2>
      <p>
        This site uses no cookies and no analytics. It uses your browser's local storage only to save draft answers on
        your own device.
      </p>
    </div>
  );
}
