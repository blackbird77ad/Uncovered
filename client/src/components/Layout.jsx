import { Info, Search, Send, ShieldCheck, UserCircle, UsersRound } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";

const navLinks = [
  { label: "Latest", href: "/stories" },
  { label: "Faceless Voices", href: "/faceless-voices", featured: true },
  { label: "Podcast", href: "/podcast" },
  { label: "Community", href: "/community", icon: UsersRound },
  { label: "Trust", href: "/trust", icon: ShieldCheck },
  { label: "Account", href: "/account", icon: UserCircle },
  { label: "About", href: "/about", icon: Info }
];

const logoUrl = "/uploads/logo.png";

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/">
          <img className="brand__logo" src={logoUrl} alt="" />
          <span>
            <strong>UNCOVERED</strong>
            <small className="brand__branch">Faceless Voices</small>
          </span>
        </Link>

        <nav className="site-nav">
          {navLinks.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.href}
                to={item.href}
                aria-label={Icon ? item.label : undefined}
                title={Icon ? item.label : undefined}
                className={({ isActive }) =>
                  [
                    isActive ? "active" : "",
                    item.featured ? "site-nav__faceless" : "",
                    Icon ? "site-nav__icon" : ""
                  ]
                    .filter(Boolean)
                  .join(" ")
                }
              >
                {Icon ? <Icon size={18} aria-hidden="true" /> : item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="site-header__actions">
          <Link className="icon-link" to="/trending" title="Trending">
            <Search size={18} />
          </Link>
          <Link className="button button--dark" to="/submit">
            <Send size={17} />
            Submit
          </Link>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div>
          <Link className="brand brand--footer" to="/">
            <img className="brand__logo" src={logoUrl} alt="" />
            <span>
              <strong>UNCOVERED</strong>
              <small>The stories behind the headlines.</small>
            </span>
          </Link>
        </div>
        <div className="site-footer__links">
          <Link to="/submit">Submit Story</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/trust">Trust</Link>
          <Link to="/policies">Policies</Link>
        </div>
      </footer>
    </div>
  );
}
