export function Footer() {
  return (
    <footer className="footer">
      <span className="footer-copy">
        © {new Date().getFullYear()} João Cardoso
      </span>
      
        className="footer-link"
        href="https://github.com/joncax/nerv-dashboard"
        target="_blank"
        rel="noreferrer"
      >
        ⌥ nerv-dashboard
      </a>
    </footer>
  );
}