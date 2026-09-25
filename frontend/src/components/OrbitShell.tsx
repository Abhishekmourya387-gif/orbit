import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AppIcon, type IconName } from './OrbitIcons'
import type { NotificationResponse, XpSummaryResponse } from '../lib/api'

export type OrbitSearchItem = { label: string; path: string; icon: IconName; hint?: string }

type OrbitShellProps = {
  activePath: string
  userName: string
  xp: XpSummaryResponse | null
  notifications: NotificationResponse[]
  challengeCount?: number
  onNavigate: (path: string) => void
  onLogout: () => void
  searchItems?: OrbitSearchItem[]
  children: ReactNode
}

const navigation: OrbitSearchItem[] = [
  { label: 'Dashboard', path: '/', icon: 'dashboard' },
  { label: 'Focus', path: '/focus', icon: 'focus' },
  { label: 'Challenges', path: '/challenges', icon: 'challenge' },
  { label: 'Habits', path: '/habits', icon: 'habit' },
  { label: 'Goals', path: '/goals', icon: 'goal' },
  { label: 'Streaks', path: '/streaks', icon: 'flame' },
  { label: 'Profile', path: '/profile', icon: 'user' },
]

function OrbitLogo({ onNavigate }: { onNavigate: () => void }) {
  return <button className="orbit-logo" type="button" onClick={onNavigate} aria-label="Go to Orbit dashboard">
    <span className="orbit-logo-mark"><i /><i /><i /></span>
    <span><strong>Orbit</strong><small>Better Habits, Bigger Dreams.</small></span>
  </button>
}

function Sidebar({ activePath, open, onClose, onNavigate, challengeCount }: { activePath: string; open: boolean; onClose: () => void; onNavigate: (path: string) => void; challengeCount: number }) {
  function isActive(path: string) {
    return path === '/' ? activePath === '/' : activePath === path || activePath.startsWith(`${path}/`)
  }

  function go(path: string) {
    onNavigate(path)
    onClose()
  }

  return <>
    <aside className={`orbit-sidebar ${open ? 'is-open' : ''}`} aria-label="Primary navigation">
      <div className="sidebar-top"><OrbitLogo onNavigate={() => go('/')} /><button className="sidebar-close icon-button" type="button" onClick={onClose} aria-label="Close navigation"><AppIcon name="close" /></button></div>
      <nav className="sidebar-nav">
        <span className="sidebar-label">Workspace</span>
        {navigation.map((item) => <button key={item.path} type="button" className={isActive(item.path) ? 'active' : ''} onClick={() => go(item.path)}><span className="nav-icon"><AppIcon name={item.icon} /></span><span>{item.label}</span>{item.path === '/challenges' && challengeCount > 0 && <small aria-label={`${challengeCount} active challenges`}>{challengeCount}</small>}</button>)}
      </nav>
      <div className="sidebar-grow" />
      <button className="sidebar-rescue" type="button" onClick={() => go('/rescue')}><span><AppIcon name="rescue" /></span><div><strong>Need a reset?</strong><small>Take a private pause</small></div><AppIcon name="arrow" size={16} /></button>
      <div className="sidebar-orbit-art" aria-hidden="true"><i /><i /><i /></div>
      <p className="sidebar-version">Orbit OS · Stay in your flow</p>
    </aside>
    {open && <button className="sidebar-scrim" type="button" aria-label="Close navigation" onClick={onClose} />}
  </>
}

function currentPageTitle(path: string) {
  if (path === '/coach') return 'Orbit Coach'
  if (path.startsWith('/challenges/')) return 'Challenge detail'
  return navigation.find((item) => item.path === path)?.label ?? 'Dashboard'
}

export function OrbitShell({ activePath, userName, xp, notifications, challengeCount = 0, onNavigate, onLogout, searchItems = [], children }: OrbitShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const initials = userName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
  const unreadCount = notifications.filter((notification) => !notification.is_read).length

  useEffect(() => {
    function handleSearchShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      }
    }
    window.addEventListener('keydown', handleSearchShortcut)
    return () => window.removeEventListener('keydown', handleSearchShortcut)
  }, [])
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return []
    return [...navigation, ...searchItems]
      .filter((item, index, all) => all.findIndex((candidate) => candidate.path === item.path) === index)
      .filter((item) => `${item.label} ${item.hint ?? ''}`.toLowerCase().includes(normalized))
      .slice(0, 6)
  }, [query, searchItems])

  function go(path: string) {
    setQuery('')
    setNotificationsOpen(false)
    setProfileOpen(false)
    onNavigate(path)
  }

  return <div className="orbit-app">
    <Sidebar activePath={activePath} open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={onNavigate} challengeCount={challengeCount} />
    <div className="orbit-workspace">
      <header className="orbit-topbar">
        <div className="topbar-left">
          <button className="mobile-menu icon-button" type="button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><AppIcon name="menu" /></button>
          <div className="topbar-title"><span>Orbit workspace</span><strong>{currentPageTitle(activePath)}</strong></div>
        </div>
        <div className="topbar-search-wrap">
          <AppIcon name="search" size={18} />
          <input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search anything..." aria-label="Search Orbit pages and challenges" aria-keyshortcuts="Control+K Meta+K" />
          <kbd>Ctrl K</kbd>
          {query && <div className="search-results">
            {results.length ? results.map((item) => <button key={item.path} type="button" onClick={() => go(item.path)}><span><AppIcon name={item.icon} size={17} /></span><div><strong>{item.label}</strong><small>{item.hint ?? 'Open page'}</small></div><AppIcon name="arrow" size={15} /></button>) : <p>No Orbit pages or challenges match “{query}”.</p>}
          </div>}
        </div>
        <div className="topbar-actions">
          <div className="header-popover-wrap">
            <button className={`icon-button ${notificationsOpen ? 'active' : ''}`} type="button" onClick={() => { setNotificationsOpen((value) => !value); setProfileOpen(false) }} aria-label="Notifications"><AppIcon name="bell" />{unreadCount > 0 && <span className="notification-dot">{unreadCount}</span>}</button>
            {notificationsOpen && <div className="header-popover notification-popover"><div className="popover-head"><div><span>Notifications</span><strong>{unreadCount ? `${unreadCount} new` : 'All caught up'}</strong></div><AppIcon name="bell" /></div>{notifications.length ? notifications.slice(0, 5).map((notification) => <div className="notification-row" key={notification.id}><span className={notification.is_read ? 'read' : ''}><AppIcon name="sparkles" size={16} /></span><div><strong>{notification.title}</strong><p>{notification.message}</p></div></div>) : <div className="popover-empty"><AppIcon name="check" /><strong>No new notifications</strong><p>Your Orbit is quiet for now.</p></div>}</div>}
          </div>
          <button className="icon-button settings-button" type="button" onClick={() => go('/profile')} aria-label="Open profile settings"><AppIcon name="settings" /></button>
          <div className="header-popover-wrap">
            <button className="user-menu-button" type="button" onClick={() => { setProfileOpen((value) => !value); setNotificationsOpen(false) }}><span className="user-avatar">{initials}</span><span className="user-menu-copy"><strong>{userName}</strong><small>Level {xp?.level ?? 1} · {xp?.total_xp ?? 0} XP</small></span><AppIcon name="chevron" size={15} /></button>
            {profileOpen && <div className="header-popover profile-popover"><div className="profile-popover-user"><span className="user-avatar large">{initials}</span><div><strong>{userName}</strong><small>{xp?.level ?? 1} · {xp?.total_xp ?? 0} XP</small></div></div><button type="button" onClick={() => go('/profile')}><AppIcon name="user" size={17} />View profile</button><button type="button" onClick={() => go('/coach')}><AppIcon name="sparkles" size={17} />Orbit Coach</button><button className="logout-action" type="button" onClick={onLogout}><AppIcon name="logout" size={17} />Log out</button></div>}
          </div>
        </div>
      </header>
      <main className="orbit-main"><div className="orbit-main-inner">{children}</div></main>
      <footer className="orbit-footer"><div><span className="footer-mark"><i /><i /></span><strong>Orbit</strong><small>© {new Date().getFullYear()}. Built for real days.</small></div><nav><button type="button" onClick={() => go('/profile')}>Profile</button><button type="button" onClick={() => go('/coach')}>Coach</button><button type="button" onClick={() => go('/challenges')}>Challenges</button></nav></footer>
    </div>
  </div>
}

