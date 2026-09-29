import { Link } from "wouter";
import { site } from "../../content/site";

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__title">
          {site.shortName}
        </Link>
        <nav aria-label="Main">
          <Link href="/process">The process</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
      </div>
    </header>
  );
}
