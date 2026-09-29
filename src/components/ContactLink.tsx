import { site } from "../content/site";

/** mailto link to the study's contact address. */
export function ContactLink() {
  return <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>;
}
