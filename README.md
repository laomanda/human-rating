# 🚀 HuMob — Human Performance Rating Platform

<p align="center">

<img src="https://img.shields.io/badge/Platform-Web%20Application-blue?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Framework-Next.js-black?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Backend-Supabase-green?style=for-the-badge"/>
<img src="https://img.shields.io/badge/AI-Groq%20Engine-orange?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Notification-Firebase-yellow?style=for-the-badge"/>

</p>

## 🧱 Struktur proyek

- src/app: route dan layout aplikasi Next.js
- src/components: komponen UI yang dapat dipakai ulang
- src/features: modul fitur bisnis seperti dashboard, profile, notification, dan settings
- src/lib: integrasi teknis dan utilitas rendah level
- src/shared: konfigurasi aplikasi dan helper bersama lintas fitur

## ▶️ Perintah utama

- npm run dev
- npm run build
- npm run lint

# 🧠 About HuMob

**HuMob (Human Mobility & Performance)** is a personal human performance measurement platform designed to evaluate daily productivity, discipline, consistency, and focus through structured activities and AI-assisted scoring.

HuMob transforms daily actions into measurable performance insights through:

- Daily activity tracking
- AI-based performance rating
- Personal analytics
- Long-term performance visualization
- Productivity improvement measurement


The philosophy behind HuMob:

> "Measure your actions. Understand your performance. Improve continuously."


---

# ✨ Main Features

## 📊 Daily Performance Rating

HuMob evaluates daily human performance using structured activities:

### Physical Activity

Examples:

- Exercise
- Running
- Walking
- Sports


### Productive Focus

Examples:

- Programming
- Studying
- Research
- Creative work


Users provide:

- Activity type
- Reason/context


HuMob does not track:

- Duration
- Distraction
- Screen time


---

# 🤖 AI Performance Engine

HuMob uses an AI rating engine to generate objective performance scores.


Architecture:

```
Web Application

        ↓

Supabase Edge Function

        ↓

Groq AI

        ↓

Performance Rating
```


AI Output:

```json
{
  "overall": 8.5,
  "discipline": 9.0,
  "productivity": 8.0,
  "consistency": 7.5,
  "focus": 9.0
}
```


Rating scale:

```
0.0 - 10.0
```


Important:

The AI does NOT provide:

❌ Advice  
❌ Motivation  
❌ Long explanations  
❌ Personal coaching  


The AI only produces numerical performance ratings.


---

# 🏗️ System Architecture


```
                 USER

                  |

                  |

          Next.js Web App

                  |

        -------------------

        |                 |

   Supabase            Firebase

   Backend             Notification


        |

        |

 Supabase Edge Function

        |

        |

      Groq AI

```


---

# 🛠️ Technology Stack


## Frontend

| Technology | Purpose |
|-|-|
| Next.js | Web Application Framework |
| TypeScript | Type Safety |
| Tailwind CSS | UI Styling |
| Framer Motion | Animation |
| Recharts | Analytics Visualization |
| Lucide React | Icons |



---

## Backend

| Technology | Purpose |
|-|-|
| Supabase PostgreSQL | Database |
| Supabase Auth | Authentication |
| Supabase Storage | File Storage |
| Row Level Security | Data Protection |
| Edge Function | Backend Processing |



---

## Authentication

Provider:

```
Supabase Auth
```

Supported:

- Email Authentication
- Google OAuth


Flow:

```
User

↓

Google Login

↓

Supabase Auth

↓

Application Profile

↓

Dashboard

```


---

# 🔥 AI Infrastructure


Provider:

```
Groq AI
```


Security:

```
GROQ_API_KEY

        ↓

Supabase Edge Function Secret

        ↓

AI Processing

```


The API key is NEVER exposed to:

- Browser
- Frontend code
- Public repository


---

# 🔔 Notification System


Provider:

```
Firebase Cloud Messaging
```


Purpose:

- Daily reminder
- Rating completion notification
- Performance updates


Architecture:

```
HuMob Web

↓

Firebase SDK

↓

Firebase Cloud Messaging

↓

User Browser Notification

```


---

# 📁 Project Structure


```
humob-web/

│

├── src/

│   │

│   ├── app/

│   │

│   ├── components/

│   │

│   ├── lib/

│   │   ├── supabase/

│   │   └── firebase/

│   │

│   ├── hooks/

│   │

│   ├── types/

│   │

│   └── utils/

│

├── public/

│

├── .env.local

│

├── package.json

│

└── README.md

```


---

# ⚙️ Environment Configuration


Create:


```
.env.local
```


Example:


```env

# =====================
# SUPABASE
# =====================

NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=



# =====================
# FIREBASE
# =====================

NEXT_PUBLIC_FIREBASE_API_KEY=

NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=

NEXT_PUBLIC_FIREBASE_PROJECT_ID=

NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=

NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=

NEXT_PUBLIC_FIREBASE_APP_ID=

NEXT_PUBLIC_FIREBASE_VAPID_KEY=

```


---

# 🚀 Installation


## Clone Repository

```bash
git clone repository-url
```


Enter directory:

```bash
cd humob-web
```


Install dependencies:

```bash
npm install
```


Run development server:


```bash
npm run dev
```


Application:

```
http://localhost:3000
```


---

# 📦 Required Packages


Main dependencies:


```json
{
 "@supabase/supabase-js": "latest",
 "firebase": "latest",
 "framer-motion": "latest",
 "recharts": "latest",
 "lucide-react": "latest",
 "clsx": "latest",
 "tailwind-merge": "latest"
}
```


---

# 🧩 Development Roadmap


## Phase 1 — Foundation

Status:

🟢 Completed


Tasks:

- Next.js setup
- TypeScript
- Tailwind
- Package installation
- Environment setup
- Supabase connection


---

## Phase 2 — Authentication

Status:

🟡 Planned


Tasks:

- Google Login
- Session management
- Protected routes
- User profile loading


---

## Phase 3 — Dashboard

Status:

🟡 Planned


Features:

- Profile card
- Overall score
- Attribute visualization
- Performance summary


---

## Phase 4 — Daily Activity System

Status:

🟡 Planned


Features:

- Physical activity input
- Productive focus input
- Validation
- Daily submission


---

## Phase 5 — AI Rating Engine

Status:

🟢 Backend Ready


Features:

- Edge Function integration
- AI scoring
- Performance attributes


---

## Phase 6 — Analytics

Status:

🟡 Planned


Features:

- Calendar rating history
- Performance charts
- Trend analysis


---

## Phase 7 — Optimization

Status:

🟡 Planned


Features:

- Responsive design
- Animation
- UX improvement
- Performance optimization


---

# 🔐 Security Principles


HuMob follows:


## Frontend Security

Public:

```
SUPABASE_ANON_KEY
Firebase Public Config
```


Private:

```
GROQ_API_KEY
SERVICE_ROLE_KEY
```

Never exposed.


---

## Backend Security


Implemented:

✅ Supabase RLS  
✅ Edge Function Secrets  
✅ OAuth Security  
✅ Protected Database Access  


---

# 🎨 Design Philosophy


HuMob follows a premium SaaS experience:


Inspired by:

- Notion
- Linear
- Apple Health


Principles:

- Minimal
- Clean
- Data-focused
- Professional
- Smooth interaction


---

# 📌 Current Status


```
Backend Infrastructure

██████████ 100%


Frontend Development

██░░░░░░░░░  Phase 1


AI Engine

██████████ 100%


Notification Infrastructure

██████░░░░  Setup Ready

```


---

# 👨‍💻 Development Notes


HuMob was originally planned as a Flutter mobile application.

The mobile client was archived due to increased complexity:

- Android SDK
- Emulator management
- Gradle configuration
- Deep linking


The project direction was migrated into:

```
Modern Next.js Web Application
```


while maintaining:

- Existing Supabase backend
- Existing authentication
- Existing AI infrastructure


---

# 🌱 Vision


HuMob aims to become a personal performance intelligence platform that helps humans understand their own consistency, discipline, and productivity through measurable daily actions.


---

<p align="center">

Built with ❤️ for personal performance improvement.

</p>