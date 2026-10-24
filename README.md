# Future Fit (Aligna)

An explainable career exploration and hiring workspace that connects job seekers' skills and evidence with structured job requirements.

## Team Information

| Field | Details |
|---|---|
| Team Name | `Hellow World` |
| Team Domain | `Domain 1` |
| SDG Track | `SDG 8 - Decent Work and Economic Growth` |
| Team Leader | `LIENG YU HAO` |
| University | `Xiamen University Malaysia` |
| Number of Members | `5` |

## Links

| Resource | Link |
|---|---|
| GitHub Repository | https://github.com/YhKen/FutureFit |
| Live Demo | https://aligna-two.vercel.app/ |
| Slide Deck | https://www.canva.com/design/DAHY1ZfUAt4/lnFjRGQP0MDQVoRzzEf4nw/edit |
| Demo Video | https://youtu.be/qcrOPATFUho |

## Overview

### Problem

Many job platforms help people search for vacancies and submit applications, but they often do not explain which evidence supports a match, which requirements are still unknown, or what the user should do next. This creates a gap between finding a job and becoming prepared for it.

The problem affects students, fresh graduates, career changers and people whose abilities come from projects, part-time work, volunteering or other non-traditional experiences. Employers also face difficulty describing requirements consistently and reviewing candidate evidence with appropriate consent.

### Solution

Future Fit combines career exploration, structured job requirements, evidence-based skill records, explainable matching and practical learning actions in one shared seeker-HR workspace.

The same structured job and application records are used on both sides. The seeker can understand current strengths, identify gaps, compare roles, save learning actions and record evidence. HR can create job requirements, review consented application information, compare relevant skills and manage interview-related records.

The matching engine is deterministic and transparent. It does not claim to predict hiring probability, competence or interview success. An optional server-side Gemini Flash-Lite pipeline summarises public workforce and career news only after source, date, jurisdiction and quotation checks. The AI layer provides bounded trend evidence and learning-priority context; it does not directly change skill scores or hiring probabilities.

### Key Features

- Seeker profile, CV/profile evidence and adaptive career exploration.
- Skill evidence, career comparison and explainable skill-gap analysis.
- Structured job requirements shared consistently between seeker and HR views.
- Transparent matching based on requirement coverage and similarity rules.
- Learning routes, practice actions and private progress records.
- Consent-controlled applications and owner-only seeker records.
- HR job-description editing, candidate comparison and interview records.
- Moderated workforce-news and AI-trend evidence with source grounding.
- Chinese, English and Malay user-interface content.

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | HTML, CSS, JavaScript ES Modules | Browser-based seeker and HR interfaces |
| Runtime | Node.js 24.x | Local server and development runtime |
| Local server | Node.js HTTP server | Static assets and permitted API proxy |
| Authentication | Firebase Authentication | Verified identity and access control |
| Database | Cloud Firestore | Profiles, jobs, applications, evidence and private records |
| Matching | Shared deterministic JavaScript matching engine | Requirement coverage, similarity and match trace |
| AI layer | Gemini Flash-Lite, optional server-side use | Public news summarisation and trend evidence |
| External references | O*NET resources and public news RSS | Occupation, skill and workforce references |
| Deployment | Vercel | Web deployment and scheduled news endpoints |
| Validation | Node.js test runner and Firestore rule checks | Regression and permission validation |

## Project Structure

```text
src/FutureFit/
├── api/                       # Vercel API and news endpoints
├── firebase/                  # Firestore security rules
├── lib/                       # Server-side helpers and AI/news policy
├── scripts/                   # Build and audit scripts
├── tests/                     # Node.js regression tests
├── vendor/                    # Third-party browser libraries
├── *.html                     # Seeker, HR and shared pages
├── *.js                       # Browser modules and product logic
├── *.css                      # Page and shared styles
├── server.cjs                 # Local Node.js server
├── package.json               # Scripts and dependencies
├── vercel.json                # Vercel configuration
└── 双击启动FutureFit.cmd       # Windows launcher
```

## Architecture

```text
Job Seeker Browser       HR Browser       Reviewer/Admin Browser
        │                     │                    │
        └────────────── Client Workspace ──────────┘
                              │
               Shared Matching and Evidence Rules
                              │
              Node.js Local Server / Vercel APIs
                    │                    │
          Firebase Auth + Firestore   News/AI Pipeline
                    │                    │
        Private records and consented   Public sources,
        application records              evidence and review
```

Private seeker records remain owner-only unless the user explicitly shares the relevant application information. The HR view uses the same frozen application snapshot and matching basis as the seeker view.

## How to Run

### Option 1 - Run Locally

The project requires Node.js 24.x.

```bash
cd src/FutureFit
npm install
npm test
npm run build
npm start
```

Open the local URL printed by the server, normally:

```text
http://127.0.0.1:4180/
```

On Windows, the project can also be started by double-clicking `双击启动FutureFit.cmd` inside `src/FutureFit/`.

Firebase Authentication and Firestore features require internet access, an authorised local domain and the configured Firebase project. The repository does not include private credentials, service-account files or personal user records.

### Option 2 - Run the Deployed Demo

Open:

https://aligna-two.vercel.app/

The live deployment may require the configured authentication and reviewer permissions. The availability of external services should be checked before judging or demonstration.

## Run Tests

```bash
cd src/FutureFit
npm test
```

Additional project checks include:

```bash
npm run test:h06
npm run audit:algorithms
npm run audit:research
```

## How We Use Replit
-Replit was used for the initial prototype and AI-assisted interface exploration. The final implementation was later refined in the team’s local repository and deployed through Vercel.


## Responsible AI and Data Boundaries

- Matching scores are transparent, uncalibrated comparison measures, not hiring probabilities.
- Names, avatars, age, gender, personality and game results do not contribute to job matching.
- Unknown information is shown as unconfirmed rather than automatically treated as a mismatch.
- The AI news layer processes public title, excerpt, source, date and canonical skill information only.
- News items require source evidence and review conditions before publication.
- Private CVs, questionnaire answers, games and learning plans are not shared with HR unless the user explicitly permits the relevant information.
- Final employment decisions remain with people.

## Challenges and Learnings

- Designing one matching explanation that remains consistent between seeker and HR views required a shared structured job and application contract.
- Separating private seeker records from consented application records required explicit Firestore ownership and sharing rules.
- AI trend information can be mistaken for labour-market prediction, so the product separates source-grounded trend evidence from matching and skill scores.
- The project must distinguish prototype validation from professional validity, large-scale user research and hiring-outcome prediction.

## Future Improvements

- Complete independent professional review of assessment and work-sample content.
- Conduct broader usability testing with real job seekers and HR users.
- Add physical-device testing and broader browser coverage.
- Connect to additional verified job and company data sources.
- Improve reviewer operations and production monitoring for the news pipeline.
- Measure user impact with a predefined Phase 2 study instead of inferring employment outcomes from prototype usage.

## Team

| Name | Role | GitHub |
|---|---|---|
| `CHENG TZE LOONG` | `HR Frontend & Hiring Workflow` | `https://github.com/Marcus-CPP` |
| `Jiang Yushan` | `Backend, Firebase & Data Security` | `https://github.com/susie070505-hash` |
| `Vivian Ma Yan Yi` | `Full-stack Integration, QA & Deployment` | `https://github.com/VV0611` |
| `Eva Ceryana` | `Matching, Evidence & AI Data` | `https://github.com/EvaCeryana` |
| `LIENG YU HAO` | `Seeker Frontend & UX` | `https://github.com/Yhken` |



## License

The submission repository is licensed under the Apache License 2.0. See the root `LICENSE` file for the full terms.

Third-party libraries, datasets and public sources retain their respective licences and attribution requirements.
