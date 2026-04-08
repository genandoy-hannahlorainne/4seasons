import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-developers',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './developers.component.html',
  encapsulation: ViewEncapsulation.None,
  styles: [`
    .developers-page{min-height:100vh;display:flex;flex-direction:column;font-family:'Inter',sans-serif}
    .header{background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);padding:0 2rem;height:70px;display:flex;align-items:center;position:sticky;top:0;z-index:200;box-shadow:0 1px 0 rgba(5,35,85,0.08),0 2px 12px rgba(0,0,0,0.04)}
    .header-content{max-width:1280px;margin:0 auto;width:100%;display:flex;justify-content:space-between;align-items:center}
    .logo{height:52px;width:auto}
    .nav{display:flex;gap:0.25rem}
    .nav-link{font-family:'Inter',sans-serif;background:none;border:none;padding:0.55rem 1.1rem;font-size:0.9rem;font-weight:600;color:#475569;cursor:pointer;border-radius:8px;transition:all 0.18s}
    .nav-link:hover,.nav-link.active{background:#f1f5f9;color:#052355}
    .dev-hero{height:360px;position:relative;display:flex;align-items:center;justify-content:center}
    .dev-hero-overlay{position:absolute;inset:0;background:linear-gradient(120deg,rgba(3,12,35,0.82) 0%,rgba(5,35,85,0.65) 100%)}
    .dev-hero-content{position:relative;z-index:1;text-align:center;color:white;padding:0 2rem}
    .dev-hero-content h1{font-family:'Plus Jakarta Sans',sans-serif;font-size:3rem;font-weight:800;margin:0 0 0.75rem;letter-spacing:-1px}
    .dev-hero-content p{font-size:1.1rem;color:rgba(255,255,255,0.75);margin:0}
    .developers-section{flex:1;padding:6rem 2rem;background:#f8fafc}
    .section-inner{max-width:1280px;margin:0 auto}
    .developers-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:2rem}
    .developer-card{background:#fff;border-radius:20px;padding:2.5rem 1.5rem;text-align:center;border:1.5px solid #e8edf5;box-shadow:0 2px 12px rgba(0,0,0,0.04);transition:all 0.22s;position:relative;overflow:hidden}
    .developer-card:hover{transform:translateY(-6px);box-shadow:0 16px 48px rgba(5,35,85,0.13);border-color:#c7d8f0}
    .developer-image{width:120px;height:120px;border-radius:50%;object-fit:cover;margin:0 auto 1.25rem;border:4px solid #e8f0fe;box-shadow:0 8px 24px rgba(5,35,85,0.1);display:block}
    .developer-name{font-family:'Plus Jakarta Sans',sans-serif;font-size:1.05rem;font-weight:700;color:#0f172a;margin:0 0 0.35rem}
    .developer-role{font-size:0.825rem;color:#64748b;margin:0;font-weight:500}
    .footer{background:#060f24;color:#475569;text-align:center;padding:1.5rem;font-size:0.85rem;border-top:1px solid rgba(255,255,255,0.06)}
    @media(max-width:1024px){.developers-grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:480px){.developers-grid{grid-template-columns:1fr}.dev-hero-content h1{font-size:2rem}}
  `]
})
export class DevelopersComponent {
  developers = [
    { name: 'Esparagoza', role: 'Full Stack Developer', image: 'assets/developers/esparagoza.jpg' },
    { name: 'Francisco',  role: 'Full Stack Developer', image: 'assets/developers/francisco.jpg' },
    { name: 'Genandoy',   role: 'Full Stack Developer', image: 'assets/developers/genandoy.jpg' },
    { name: 'Villas',     role: 'Full Stack Developer', image: 'assets/developers/villas.jpg' },
  ];
}
