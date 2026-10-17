"use client";

import { useEffect, useState } from "react";
import { Link } from "react-router";

const links = [["Services", "#services"], ["Solutions", "#solutions"], ["Work", "#work"], ["About", "#about"], ["Contact", "#contact"]];

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <header className={`site-header${scrolled ? " is-scrolled" : ""}`}><nav className="container nav-shell" aria-label="Main navigation"><Link className="agency-brand" to="/" aria-label="Morrow Studio home"><span className="agency-mark">m<span>✳</span></span><span>MORROW<span className="brand-sub">DIGITAL + AI STUDIO</span></span></Link><button className="menu-toggle" type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen(!open)}><i/><i/></button><div className={`nav-content${open ? " nav-open" : ""}`}><div className="nav-links">{links.map(([label, href]) => <a key={label} href={href} onClick={() => setOpen(false)}>{label}</a>)}</div><Link className="button button-nav" to="/login">Start a project <span>↗</span></Link></div></nav></header>;
}
