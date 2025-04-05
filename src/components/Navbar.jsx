import 'bootstrap/dist/css/bootstrap.min.css';
import './Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark custom-navbar">
      <div className="container-fluid">
        <a className="navbar-brand glow-text" href="/">SweetSwap</a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav">
            {['Home', 'Rewards', 'Contact'].map((item, index) => (
              <li className="nav-item" key={index}>
                <a className="nav-link glow-link" href={`/${item.toLowerCase()}`}>
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
