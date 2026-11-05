'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, SquarePen, Disc3, Tv, Gamepad2, BookOpen, MessageSquare, Wrench, Inbox } from 'lucide-react';
import { getCurrent } from './current';

export default function Nav() {
  const current = getCurrent(usePathname());
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.authenticated) {
          setIsAuthenticated(true);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <nav className="top-nav">
      <Link href="/" className="nav-brand">
        <span className="dot"></span>kurzagin<span className="jp">クルザギン</span>
      </Link>
      <ul className="nav-links">
        <li><Link href="/profile" className={current === 'profile' ? 'active' : ''}><User size={13} /><span>profile</span></Link></li>
        <li><Link href="/#blog" className={current === 'home' ? 'active' : ''}><SquarePen size={13} /><span>blog</span></Link></li>
        <li><Link href="/music" className={current === 'music' ? 'active' : ''}><Disc3 size={13} /><span>music</span></Link></li>
        <li><Link href="/anime" className={current === 'anime' ? 'active' : ''}><Tv size={13} /><span>anime</span></Link></li>
        <li><Link href="/games" className={current === 'games' ? 'active' : ''}><Gamepad2 size={13} /><span>games</span></Link></li>
        <li><Link href="/novels" className={current === 'novels' ? 'active' : ''}><BookOpen size={13} /><span>novels</span></Link></li>
        <li><Link href="/tools" className={current === 'tools' ? 'active' : ''}><Wrench size={13} /><span>tools</span></Link></li>
        <li><Link href="/guestbook" className={current === 'guestbook' ? 'active' : ''}><MessageSquare size={13} /><span>guestbook</span></Link></li>
        {isAuthenticated && (
          <li>
            <Link
              href="/messages"
              className={current === 'messages' ? 'active' : ''}
              style={{ color: current === 'messages' ? 'var(--accent)' : 'var(--text-1)' }}
            >
              <Inbox size={13} /><span>messages</span>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
