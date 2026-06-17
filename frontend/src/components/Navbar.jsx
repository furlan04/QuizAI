import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNotifications } from "../hooks/useNotifications";
import { describeNotification } from "../services/NotificationsService";

/* ── Inline SVG icons (no emoji) ── */
const IcHome = () => (
  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11.5L12 4l9 7.5"/><path d="M5 10v10h14V10"/>
  </svg>
);

const IcQuiz = () => (
  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 8h8M8 12h6M8 16h4"/>
  </svg>
);

const IcFriends = () => (
  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
    <circle cx="17" cy="8" r="3"/><path d="M21 20c0-3.3-2.7-6-6-6"/>
  </svg>
);

const IcCreate = () => (
  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

const IcProfile = () => (
  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>
  </svg>
);

const IcBuddy = () => (
  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const IcSettings = () => (
  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const IcLogout = () => (
  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const IcLogin = () => (
  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
    <polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
  </svg>
);

const IcRegister = () => (
  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
  </svg>
);

const IcArrow = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6"/>
  </svg>
);

const IcBell = () => (
  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.7 21a2 2 0 0 1-3.4 0"/>
  </svg>
);

/* ── Brand mark ── */
function BrandMark() {
  return (
    <div className="brand-mark">
      Q
    </div>
  );
}

/* ── Lista notifiche del dropdown ── */
function NotifList({ notifications, onOpen }) {
  if (notifications.length === 0) {
    return <div className="notif-empty">Nessuna notifica</div>;
  }
  return notifications.map((n) => {
    const { text, detail } = describeNotification(n);
    return (
      <button
        key={n.id}
        type="button"
        className={`notif-dd-item${n.read ? "" : " unread"}`}
        onClick={() => onOpen(n)}
      >
        {!n.read && <span className="notification-dot" aria-hidden="true" />}
        <span className="notif-dd-text">
          {text}{detail ? ` — ${detail}` : ""}
        </span>
      </button>
    );
  });
}

export default function Navbar() {
  const { isAuthenticated: isLoggedIn, logout: onLogout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [friendsDropdownOpen, setFriendsDropdownOpen] = useState(false);
  const [quizDropdownOpen, setQuizDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const desktopNavRef = useRef(null);
  const mobileNavRef = useRef(null);

  const { notifications, unreadCount, markRead } = useNotifications({ enabled: isLoggedIn, limit: 6 });

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handleClickOutside = (event) => {
      const inDesktop = desktopNavRef.current && desktopNavRef.current.contains(event.target);
      const inMobile  = mobileNavRef.current  && mobileNavRef.current.contains(event.target);
      if (!inDesktop && !inMobile) closeAll();
    };
    if (quizDropdownOpen || friendsDropdownOpen || notifDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [quizDropdownOpen, friendsDropdownOpen, notifDropdownOpen]);

  const toggleQuiz    = () => { setQuizDropdownOpen(v => !v);    setFriendsDropdownOpen(false); setNotifDropdownOpen(false); };
  const toggleFriends = () => { setFriendsDropdownOpen(v => !v); setQuizDropdownOpen(false);    setNotifDropdownOpen(false); };
  const toggleNotif   = () => { setNotifDropdownOpen(v => !v);   setQuizDropdownOpen(false);    setFriendsDropdownOpen(false); };
  const closeAll      = () => { setQuizDropdownOpen(false); setFriendsDropdownOpen(false); setNotifDropdownOpen(false); };

  const openNotification = async (n) => {
    const { to } = describeNotification(n);
    if (!n.read) await markRead(n.id);
    closeAll();
    navigate(to);
  };

  /* ── Public sidebar (not logged in) ── */
  if (!isLoggedIn) {
    return (
      <>
        <aside className="sidebar-desktop">
          <Link className="sidebar-brand" to="/">
            <BrandMark />
            <span className="brand-text">quiz<em>AI</em></span>
          </Link>

          <nav className="sidebar-nav">
            <Link to="/"         className={`nav-item${isActive("/") ? " active" : ""}`}>
              <span className="nav-icon"><IcHome /></span>
              <span className="nav-text">Home</span>
            </Link>
            <Link to="/login"    className={`nav-item${isActive("/login") ? " active" : ""}`}>
              <span className="nav-icon"><IcLogin /></span>
              <span className="nav-text">Accedi</span>
            </Link>
            <Link to="/register" className={`nav-item${isActive("/register") ? " active" : ""}`}>
              <span className="nav-icon"><IcRegister /></span>
              <span className="nav-text">Registrati</span>
            </Link>
          </nav>
        </aside>

        <nav className="sidebar-mobile">
          <Link to="/"         className={`mobile-nav-item${isActive("/") ? " active" : ""}`}>
            <span className="mobile-nav-icon"><IcHome /></span>
            <span className="mobile-nav-text">Home</span>
          </Link>
          <Link to="/login"    className={`mobile-nav-item${isActive("/login") ? " active" : ""}`}>
            <span className="mobile-nav-icon"><IcLogin /></span>
            <span className="mobile-nav-text">Accedi</span>
          </Link>
          <Link to="/register" className={`mobile-nav-item${isActive("/register") ? " active" : ""}`}>
            <span className="mobile-nav-icon"><IcRegister /></span>
            <span className="mobile-nav-text">Registrati</span>
          </Link>
        </nav>
      </>
    );
  }

  /* ── Authenticated sidebar ── */
  const quizActive    = ["/quizzes", "/quizzes/create", "/attempted-quizzes", "/liked-quizzes"].some(p => location.pathname.startsWith(p) || isActive(p));
  const friendsActive = ["/friendship"].some(p => location.pathname.startsWith(p));

  return (
    <>
      <aside className="sidebar-desktop" ref={desktopNavRef}>
        <Link className="sidebar-brand" to="/">
          <BrandMark />
          <span className="brand-text">quiz<em>AI</em></span>
        </Link>

        <nav className="sidebar-nav">
          {/* Home */}
          <Link to="/" className={`nav-item${isActive("/") ? " active" : ""}`}>
            <span className="nav-icon"><IcHome /></span>
            <span className="nav-text">Per te</span>
          </Link>

          {/* Quiz dropdown */}
          <div className={`nav-dropdown${quizDropdownOpen ? " open" : ""}`}>
            <button type="button" className={`nav-item nav-dd-toggle${quizActive ? " active" : ""}`} onClick={toggleQuiz}>
              <span className="nav-icon"><IcQuiz /></span>
              <span className="nav-text">Quiz</span>
              <span className="nav-dd-arrow"><IcArrow /></span>
            </button>
            {quizDropdownOpen && (
              <div className="nav-dd-panel">
                <Link to="/quizzes"           className="nav-item" onClick={closeAll}>I miei Quiz</Link>
                <Link to="/attempted-quizzes" className="nav-item" onClick={closeAll}>Quiz provati</Link>
                <Link to="/quizzes/create"    className="nav-item" onClick={closeAll}>Crea quiz</Link>
              </div>
            )}
          </div>

          {/* Friends dropdown */}
          <div className={`nav-dropdown${friendsDropdownOpen ? " open" : ""}`}>
            <button type="button" className={`nav-item nav-dd-toggle${friendsActive ? " active" : ""}`} onClick={toggleFriends}>
              <span className="nav-icon"><IcFriends /></span>
              <span className="nav-text">Amicizie</span>
              <span className="nav-dd-arrow"><IcArrow /></span>
            </button>
            {friendsDropdownOpen && (
              <div className="nav-dd-panel">
                <Link to="/friendship/requests" className="nav-item" onClick={closeAll}>Richieste</Link>
                <Link to="/friendship/friends"  className="nav-item" onClick={closeAll}>Amici</Link>
              </div>
            )}
          </div>

          {/* Notifications dropdown */}
          <div className={`nav-dropdown${notifDropdownOpen ? " open" : ""}`}>
            <button type="button" className={`nav-item nav-dd-toggle${isActive("/notifications") ? " active" : ""}`} onClick={toggleNotif}>
              <span className="nav-icon notif-bell">
                <IcBell />
                {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
              </span>
              <span className="nav-text">Notifiche</span>
              <span className="nav-dd-arrow"><IcArrow /></span>
            </button>
            {notifDropdownOpen && (
              <div className="nav-dd-panel notif-dd-panel">
                <NotifList notifications={notifications} onOpen={openNotification} />
                <Link to="/notifications" className="nav-item notif-dd-all" onClick={closeAll}>Vedi tutte</Link>
              </div>
            )}
          </div>

          {/* Create */}
          <Link to="/quizzes/create" className={`nav-item${isActive("/quizzes/create") ? " active" : ""}`}>
            <span className="nav-icon"><IcCreate /></span>
            <span className="nav-text">Crea</span>
          </Link>

          {/* Buddy */}
          <Link to="/buddy" className={`nav-item${location.pathname.startsWith("/buddy") ? " active" : ""}`}>
            <span className="nav-icon"><IcBuddy /></span>
            <span className="nav-text">Buddy</span>
          </Link>

          {/* Profile */}
          <Link to="/profile" className={`nav-item${location.pathname.startsWith("/profile") ? " active" : ""}`}>
            <span className="nav-icon"><IcProfile /></span>
            <span className="nav-text">Profilo</span>
          </Link>

          {/* Settings */}
          <Link to="/settings" className={`nav-item${isActive("/settings") ? " active" : ""}`}>
            <span className="nav-icon"><IcSettings /></span>
            <span className="nav-text">Impostazioni</span>
          </Link>

          {/* Logout */}
          <button type="button" onClick={onLogout} className="nav-item logout-btn">
            <span className="nav-icon"><IcLogout /></span>
            <span className="nav-text">Logout</span>
          </button>
        </nav>
      </aside>

      {/* ── Mobile bottom navigation ── */}
      <nav className="sidebar-mobile" ref={mobileNavRef}>
        <Link to="/" className={`mobile-nav-item${isActive("/") ? " active" : ""}`}>
          <span className="mobile-nav-icon"><IcHome /></span>
          <span className="mobile-nav-text">Per te</span>
        </Link>

        {/* Mobile quiz dropdown */}
        <div className="mobile-nav-dropdown">
          <button type="button" className={`mobile-nav-item${quizDropdownOpen ? " active" : ""}`} onClick={toggleQuiz}>
            <span className="mobile-nav-icon"><IcQuiz /></span>
            <span className="mobile-nav-text">Quiz</span>
          </button>
          {quizDropdownOpen && (
            <div className="mobile-dropdown-menu">
              <Link to="/quizzes"           className="mobile-dropdown-item" onClick={closeAll}>I miei Quiz</Link>
              <Link to="/attempted-quizzes" className="mobile-dropdown-item" onClick={closeAll}>Quiz provati</Link>
              <Link to="/quizzes/create"    className="mobile-dropdown-item" onClick={closeAll}>Crea quiz</Link>
            </div>
          )}
        </div>

        {/* Mobile friends dropdown */}
        <div className="mobile-nav-dropdown">
          <button type="button" className={`mobile-nav-item${friendsDropdownOpen ? " active" : ""}`} onClick={toggleFriends}>
            <span className="mobile-nav-icon"><IcFriends /></span>
            <span className="mobile-nav-text">Amici</span>
          </button>
          {friendsDropdownOpen && (
            <div className="mobile-dropdown-menu">
              <Link to="/friendship/requests" className="mobile-dropdown-item" onClick={closeAll}>Richieste</Link>
              <Link to="/friendship/friends"  className="mobile-dropdown-item" onClick={closeAll}>Amici</Link>
            </div>
          )}
        </div>

        {/* Mobile notifications dropdown */}
        <div className="mobile-nav-dropdown">
          <button type="button" className={`mobile-nav-item${notifDropdownOpen ? " active" : ""}`} onClick={toggleNotif}>
            <span className="mobile-nav-icon notif-bell">
              <IcBell />
              {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </span>
            <span className="mobile-nav-text">Notifiche</span>
          </button>
          {notifDropdownOpen && (
            <div className="mobile-dropdown-menu notif-dd-panel">
              <NotifList notifications={notifications} onOpen={openNotification} />
              <Link to="/notifications" className="mobile-dropdown-item notif-dd-all" onClick={closeAll}>Vedi tutte</Link>
            </div>
          )}
        </div>

        <Link to="/buddy" className={`mobile-nav-item${location.pathname.startsWith("/buddy") ? " active" : ""}`}>
          <span className="mobile-nav-icon"><IcBuddy /></span>
          <span className="mobile-nav-text">Buddy</span>
        </Link>

        <Link to="/profile" className={`mobile-nav-item${location.pathname.startsWith("/profile") ? " active" : ""}`}>
          <span className="mobile-nav-icon"><IcProfile /></span>
          <span className="mobile-nav-text">Profilo</span>
        </Link>

        <button type="button" onClick={onLogout} className="mobile-nav-item logout-btn">
          <span className="mobile-nav-icon"><IcLogout /></span>
          <span className="mobile-nav-text">Esci</span>
        </button>
      </nav>
    </>
  );
}
