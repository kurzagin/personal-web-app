// @ts-nocheck
'use client';

import React from 'react';
import Link from 'next/link';
import { Globe, ExternalLink } from 'lucide-react';
import { css } from '../_ui/css';
import type { DbProfile, ProjectEntry, SocialLinkEntry, ContactDetailEntry } from '@/lib/db';

interface ProfileClientProps {
  profile: DbProfile;
}

export default function ProfileClient({
  profile,
}: ProfileClientProps) {
  const currentlyBuilding: ProjectEntry[] = (profile.currently_building as ProjectEntry[]) || [];
  const techStack: string[] = (profile.tech_stack as string[]) || [];
  const socialLinks: SocialLinkEntry[] = (profile.social_links as SocialLinkEntry[]) || [];
  const contactDetails: ContactDetailEntry[] = (profile.contact_details as ContactDetailEntry[]) || [];

  return (
    <>
  <div className="page-header">
    <div style={css("display: flex; align-items: flex-end; justify-content: space-between; flex-wrap: wrap; gap: 16px;")}>
      <div>
        <h1><span className="hl">operator</span> dossier</h1>
        <div className="page-sub"><span className="jp-label">人物・経歴</span> — architecture, systems, projects & contact</div>
      </div>
    </div>
  </div>

  <section className="section">
    {/* PROFILE HERO DOSSIER CARD */}
    <div className="profile-hero bracket-card reveal">
      <div
        className="profile-banner"
        style={profile.banner_url ? { backgroundImage: `url('${profile.banner_url}')`, backgroundSize: 'cover' } : undefined}
      >
        <div className="profile-banner-grid"></div>
      </div>

      <div className="profile-hero-content">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} loading="eager" />
            ) : (
              <span>𒀭</span>
            )}
          </div>
        </div>

        <div className="profile-info">
          <div className="profile-name-row">
            <h2 className="profile-name">{profile.name}</h2>
            <span className="profile-handle">{profile.handle}</span>
            {profile.status_message && (
              <div className="profile-status-badge">
                <span className="dot"></span>
                <span>{profile.status_message}</span>
              </div>
            )}
          </div>

          {profile.headline && (
            <p className="profile-headline">{profile.headline}</p>
          )}

          {profile.location && (
            <div className="profile-coords">
              <span>COORD: {profile.location}</span>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* DOSSIER DETAIL SECTIONS */}
    <div className="profile-meta-grid reveal">
      {/* BIO & PHILOSOPHY BLOCK */}
      <div className="profile-block">
        <div className="profile-block-title">
          <span>// 01. IDENTITY & BIO</span>
          <span className="jp-label" style={css("font-size: 0.65rem;")}>概要</span>
        </div>
        <div className="profile-bio-text">
          {profile.bio}
        </div>
      </div>

      {/* CURRENTLY BUILDING BLOCK */}
      <div className="profile-block">
        <div className="profile-block-title">
          <span>// 02. CURRENTLY BUILDING</span>
          <span className="jp-label" style={css("font-size: 0.65rem;")}>開発中</span>
        </div>
        <div>
          {currentlyBuilding.length === 0 ? (
            <div style={css("font-family: var(--mono); font-size: 0.75rem; color: var(--text-3);")}>
              // no active projects listed
            </div>
          ) : (
            currentlyBuilding.map((item) => (
              <a
                key={item.title}
                href={item.url || '#'}
                target={item.url ? "_blank" : undefined}
                rel={item.url ? "noopener noreferrer" : undefined}
                className="project-item"
                style={!item.url ? { pointerEvents: 'none' } : undefined}
              >
                <div className="project-header">
                  <span className="project-title">{item.title}</span>
                  {item.badge && (
                    <span className={`project-badge ${item.badge.toLowerCase()}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="project-desc">{item.desc || item.description}</div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>

    {/* STACK, SOCIAL MEDIA & CONTACT GRID */}
    <div className="profile-meta-grid reveal" style={css("margin-top: 20px;")}>
      {/* TOOLS & TECH STACK */}
      <div className="profile-block">
        <div className="profile-block-title">
          <span>// 03. TOOLS & ARCHITECTURE</span>
          <span className="jp-label" style={css("font-size: 0.65rem;")}>技術スタック</span>
        </div>
        <div className="stack-pills">
          {techStack.map((tech) => (
            <span key={tech} className="stack-pill">{tech}</span>
          ))}
        </div>
      </div>

      {/* SOCIAL MEDIA & CHANNELS */}
      <div className="profile-block">
        <div className="profile-block-title">
          <span>// 04. SOCIAL & LINKS</span>
          <span className="jp-label" style={css("font-size: 0.65rem;")}>通信網</span>
        </div>
        <div>
          {socialLinks.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="social-item-row"
            >
              <div className="social-platform-label" style={css("display: flex; align-items: center; gap: 6px;")}>
                <Globe size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span style={css("font-weight: 500;")}>{link.platform}</span>
                <span style={css("font-family: var(--mono); font-size: 0.75rem; color: var(--text-2);")}>({link.label})</span>
              </div>
              <ExternalLink size={12} className="social-arrow" />
            </a>
          ))}
        </div>
      </div>
    </div>

    {/* CONTACT BLOCK */}
    <div className="profile-block reveal" style={css("margin-top: 20px;")}>
      <div className="profile-block-title">
        <span>// 05. CONTACT & COLLABORATION</span>
        <span className="jp-label" style={css("font-size: 0.65rem;")}>連絡先</span>
      </div>

      {profile.contact_note && (
        <p style={css("font-size: 0.9rem; color: var(--text-1); margin-bottom: 16px;")}>
          {profile.contact_note}
        </p>
      )}

      <div className="contact-box">
        {contactDetails.map((c) => (
          <div key={c.channel || c.method} className="contact-method-row">
            <span className="contact-label">{(c.channel || c.method || '').toUpperCase()}</span>
            <span className="contact-val">
              {c.url || c.link ? (
                <a href={c.url || c.link} target={(c.url || c.link).startsWith('http') ? "_blank" : undefined} rel="noopener noreferrer">
                  {c.value}
                </a>
              ) : (
                <span style={css("color: var(--text-0); font-family: var(--mono);")}>{c.value}</span>
              )}
            </span>
          </div>
        ))}
        {profile.contact_email && !contactDetails.some((d) => d.value === profile.contact_email) && (
          <div className="contact-method-row">
            <span className="contact-label">DIRECT EMAIL</span>
            <span className="contact-val">
              <a href={`mailto:${profile.contact_email}`}>{profile.contact_email}</a>
            </span>
          </div>
        )}
      </div>
    </div>
  </section>
    </>
  );
}