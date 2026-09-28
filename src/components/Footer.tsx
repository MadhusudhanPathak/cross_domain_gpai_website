import { site } from "../content/site";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <span>
          Contact: <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
        </span>
        <span>No cookies. No tracking. Answers are stored in a Google Sheet accessible only to the research team.</span>
      </div>
    </footer>
  );
}
