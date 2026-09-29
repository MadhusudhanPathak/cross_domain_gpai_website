import { ContactLink } from "../ContactLink";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <span>
          Contact: <ContactLink />
        </span>
        <span>No cookies. No tracking. Answers are stored in a Google Sheet accessible only to the research team.</span>
      </div>
    </footer>
  );
}
