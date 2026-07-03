# Project Architecture & Necessary Information

## File Architecture

```text
NasrallahRAFI/
    .gitignore
    a3c66107815495964ea7a8fede11f3fc.txt
    apprenticeship-rafi-fr.html
    apprenticeship-rafi.html
    CNAME
    index-fr.html
    index.html
    internship-onee-fr.html
    internship-onee.html
    internship-smcv-fr.html
    internship-smcv.html
    llms.txt
    package.json
    pfe-gantt-fr.html
    pfe-gantt.html
    PRODUCT.md
    project-rendezvous-fr.html
    project-rendezvous.html
    project-smart-bms-fr.html
    project-smart-bms.html
    project-thermal-fr.html
    project-thermal.html
    project-waveguide-fr.html
    project-waveguide.html
    robots.txt
    sitemap.xml
    tailwind.config.js
    _headers
    css/
        style.css
        style.min.css
        tailwind-input.css
        tailwind.min.css
    js/
        indexnow.mjs
        remove_lang.py
        theme.js
```

## Essential Configuration Files

### `.gitignore`

```txt
server.log
server.err.log
.env
*.env

```

### `llms.txt`

```txt
# Rafi Nasrallah — Electrical Engineer Portfolio

> State Engineer in Electrical Engineering (ENSET Mohammedia, 2026) specialising in Smart
> Battery Management Systems, embedded hardware design, and industrial IoT. Patent holder
> (OMPIC #65133). Based in Dar Bouazza, Morocco.

Rafi Nasrallah is a Moroccan electrical engineer whose work centres on battery intelligence:
physical modelling of LiFePO4 cells, hybrid SOC/SOH estimation pipelines (ECM 3RC + UKF +
LSTM residual correction), STM32-based BMS hardware designed in Altium Designer, and
real-time production dashboards over MQTT/REST. He holds a granted patent for an automated
corrugated-web beam welding and assembly system (OMPIC #65133, November 2025).

## Projects

- [French homepage](https://nasrallahrafi.me/index-fr.html): Professional French version of the main portfolio, written with academic and engineering terminology rather than literal translation.
- [Smart BMS for Electric Mobility](https://nasrallahrafi.me/project-smart-bms.html): End-of-studies internship project at Emove Véhicules focused on LFP electric scooter battery reliability, ECM/UKF/LSTM SOC estimation, STM32-based BMS hardware architecture, battery quality procedures, and industrial supervision.
- [Rectangular Waveguide TE10 Analysis](https://nasrallahrafi.me/project-waveguide.html): ANSYS HFSS simulation of WR-90 waveguide with air and alumina dielectric loading. Key result: alumina loading shifts the cutoff frequency from 6.56 GHz to 2.19 GHz with measured insertion loss of 0.26–0.72 dB.
- [Transient Thermal Analysis — FEA vs LCM](https://nasrallahrafi.me/project-thermal.html): Comparative study of Lumped Capacitance Modelling vs ANSYS FEA (Fusion 360) for hot-nut insertion cycle validation in polycarbonate. Full report available as PDF.
- [Luenberger-Based Orbital Rendezvous Control](https://nasrallahrafi.me/project-rendezvous.html): Full autopilot system (Luenberger Observer + State-Feedback Controller) for satellite rendezvous using angle-only measurements, with system normalisation to overcome numerical instability. Implemented in MATLAB/Simulink.
- BMS Digital Twin — Emove Véhicules (Feb–May 2026): High-fidelity 15S2P LFP battery digital twin integrating dynamic hysteresis, ECM 3RC + UKF + LSTM SOC estimation, active balancing (LTC3300-1), STM32 16S BMS hardware, HiL validation (RMSE < 2 %), and MQTT/REST production dashboard.

## Experience

- [Engineering Intern — Emove Véhicules](https://nasrallahrafi.me/#experience) (Feb–May 2026): R&D and industrialisation internship. Resolved premature shutdown at 20 % SOC and energy gauge instability on electric scooters via coupled hardware/software/process approach.
- [Internship — SMCV](https://nasrallahrafi.me/internship-smcv.html) (2025): HMI design (WinCC), injection moulding machine automation, mechanical arm design (Inventor), thermal analysis of nut insertion press.
- [Internship — ONEE Mohammedia Thermal Power Plant](https://nasrallahrafi.me/internship-onee.html) (Jul–Aug 2024): Formalised test procedures for Siemens SIPROTEC digital protection relays using OMICRON CMC. Supervisor evaluation: 18.5/20.
- [Apprenticeship — Rafi Robotiques et Machineries](https://nasrallahrafi.me/apprenticeship-rafi.html) (2020–2023): Three-year industrial apprenticeship covering CNC lathe repair (Siemens Sinumerik 840D / Simodrive 611), 5-axis welding robot fabrication, PLC reprogramming, and heavy-machine restoration.

## Skills

Battery modelling (ECM 3RC, hysteresis), SOC/SOH estimation (UKF, LSTM), digital twin
development, STM32 firmware, Altium Designer PCB layout, CAN/I2C/SPI, MATLAB/Simulink,
Python, ANSYS HFSS, ANSYS Thermal, Fusion 360, MQTT, REST API, PLC programming, Siemens
Sinumerik 840D, WinCC HMI, Caneco BT, ETAP, IEC 62133, ISO 26262, ISO 9001.

## Education

- Engineering Degree in Electrical Engineering and Industrial Systems Control — ENSET Mohammedia (2023–2026)
- Licence in Physical Sciences (Electronics) — Faculté des Sciences Ben M'sik, Casablanca (2022–2023)
- DEUG in Physical Sciences — Faculté des Sciences Ben M'sik, Casablanca (2020–2022)

## Contact

- Email: nasrollahrafi@gmail.com
- Phone: +212 671 114 377
- GitHub: https://github.com/NasrallahRAFI
- Portfolio: https://nasrallahrafi.me/

## Optional

- [CV (English)](https://nasrallahrafi.me/assets/pdf/RAFI_Nasrallah_CV_ENG.pdf)
- [CV (French)](https://nasrallahrafi.me/assets/pdf/RAFI_Nasrallah_CV_FR.pdf)
- [Waveguide Analysis Report (PDF)](https://nasrallahrafi.me/assets/pdf/ANALYSIS_OF_TE10_MODE_PROPAGATION.pdf)
- [Thermal Analysis Report (PDF)](https://nasrallahrafi.me/assets/pdf/Thermal_Analysis_Full_Report.pdf)
- [Luenberger Rendezvous Paper (PDF)](https://nasrallahrafi.me/assets/pdf/Luenberger_Based_Rendezvous_Control_with_Angle_Only_Data.pdf)

```

### `package.json`

```json
{
  "name": "nasrallahrafi",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "build:css": "tailwindcss -i ./css/tailwind-input.css -o ./css/tailwind.min.css --minify",
    "watch:css": "tailwindcss -i ./css/tailwind-input.css -o ./css/tailwind.min.css --watch",
    "build:style": "cleancss -o css/style.min.css css/style.css",
    "indexnow": "node js/indexnow.mjs"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/NasrallahRAFI/NasrallahRAFI.git"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "bugs": {
    "url": "https://github.com/NasrallahRAFI/NasrallahRAFI/issues"
  },
  "homepage": "https://github.com/NasrallahRAFI/NasrallahRAFI#readme",
  "devDependencies": {
    "clean-css-cli": "^5.6.3",
    "tailwindcss": "^3.4.19"
  }
}

```

### `PRODUCT.md`

```md
# Product

## Register

brand

## Users

Engineering recruiters, hiring managers, technical leads, and potential collaborators evaluating Rafi Nasrallah's electrical engineering experience, project depth, and professional fit.

## Product Purpose

Present a credible, concise engineering portfolio that makes technical expertise, completed work, education, and contact paths easy to assess. Success means a visitor can quickly understand Rafi's specialization and confidently continue to project details, download a CV, or make contact.

## Brand Personality

Precise, technical, confident. The voice is direct and evidence-led, with professional warmth and no inflated marketing language.

## Anti-references

Avoid generic SaaS landing-page patterns, excessive glass effects, decorative gradients without meaning, cluttered dashboards, novelty motion, and visual treatments that compete with the engineering work.

## Design Principles

- Lead with engineering credibility and specific evidence.
- Make the visitor's next action obvious without overwhelming them.
- Use technical detail to build confidence, then reveal depth progressively.
- Keep visual emphasis disciplined so projects and qualifications remain primary.
- Preserve a professional, personal tone rather than a corporate template aesthetic.

## Accessibility & Inclusion

Target WCAG AA contrast, complete keyboard access, visible focus states, reduced-motion support, readable responsive typography, and touch targets of at least 44 by 44 pixels.

```

### `robots.txt`

```txt
User-agent: *
Allow: /
Disallow: /server.log
Disallow: /server.err.log
Crawl-delay: 1
Sitemap: https://nasrallahrafi.me/sitemap.xml
X-IndexNow-Key: a3c66107815495964ea7a8fede11f3fc

# AI crawlers — explicitly permitted
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: meta-externalagent
Allow: /

```

### `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./js/**/*.js",
  ],
  safelist: [
    'theme-glass',
    'theme-volt',
    'theme-deepsea',
    'theme-obsidian',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    function ({ addBase }) {
      addBase({
        '.theme-glass': { '--tw-theme-safelist': 'glass' },
        '.theme-volt': { '--tw-theme-safelist': 'volt' },
        '.theme-deepsea': { '--tw-theme-safelist': 'deepsea' },
        '.theme-obsidian': { '--tw-theme-safelist': 'obsidian' },
      })
    },
  ],
}

```

### `_headers`

```txt
/assets/img/*
  Cache-Control: public, max-age=31536000, immutable

/assets/pdf/*
  Cache-Control: public, max-age=31536000, immutable

/css/*
  Cache-Control: public, max-age=86400

/js/*
  Cache-Control: public, max-age=86400

/*.html
  Cache-Control: public, max-age=3600

```

