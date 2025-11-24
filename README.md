# CS Grad Application Insight Platform

A web-based platform for collecting, browsing, and analyzing historical Computer Science graduate application records.

- Contribute their own (anonymized) profiles and application results.
- Explore past application outcomes with rich filters.
- Get program suggestions based on similar backgrounds.

This project is implemented with:

- **Frontend:** Web interface (HTML/CSS/JS)
- **Backend:** Python (Flask recommended)
- **Database:** SQLite

---

## 1. Project Overview

We want to build an online website which summarizes the graduate universities applications from across the world, every one can submit their application result including which university accepted or rejected them along with their academic background. So that the new applicant could review the database and compare with their own background and get to know which universities they have a good chance to get the offer.

---

## 2. Features

### 2.1 Public (Guest) Features

- **Home Page**
  - Platform introduction.
  - Key statistics:
    - Total number of applications.
    - Number of universities and programs.
    - Recently added application records.

- **Explore Applications**
  - Filter and search by:
    - University
    - Country/Region
    - Program (e.g., MS CS, MS DS, PhD CS)
    - Degree type (MS/PhD)
    - Term (e.g., Fall 2025)
    - Result (Admit / Reject / Waitlist)
  - View anonymized applicant snapshots:
    - GPA range
    - Test score range
    - Whether they have research, internships, publications
  - Sort by admit rate, university name, or other fields.

### 2.2 Registered User Features

- **Authentication**
  - Register with email + password.
  - Login/logout using secure sessions.
  - Passwords stored as hashes (no plain text).

- **Profile & Background Management**
  - Maintain personal background, including:
    - Education history (institutions, degrees, GPA)
    - Test scores (GRE, TOEFL/IELTS, etc.)
    - Research experience
    - Internships / work experience
    - Recommendation letter strength (self-reported)
    - Publications (title, venue, journal tier, author role)

- **Application Records Management**
  - Add application entries:
    - University, program, term
    - Result (Admit/Reject/Waitlist)
    - Funding / scholarship information
    - Notes (e.g., “interview required”, “priority deadline”, etc.)
  - Edit / delete own entries.
  - If a university or program does not exist:
    - User can submit a new entry (directly added or marked for review).

- **“Match Me” Suggestions (Rule-Based)**
  - Use the logged-in user’s background to:
    - Find historically similar profiles.
    - Recommend programs grouped as:
      - **Reach** (above typical admitted stats)
      - **Match** (similar to successful cases)
      - **Safe** (below or near median admitted stats)
  - Implemented with transparent rules (e.g., GPA, test scores, research flags),
    suitable for a course project (no complex ML required).

### 2.3 Admin Features (Optional)

For extended versions:

- Manage university/program dictionaries.
- Approve or correct user-submitted universities/programs.
- Flag or remove invalid/abusive records.

---

## 3. Tech Stack

**Frontend**

- HTML5, CSS3, JavaScript
- Optional UI frameworks: Bootstrap / Tailwind CSS

**Backend**

- Python 3.x
- Flask (or similar Python web framework)

**Database**

- SQLite
  - Simple file-based database.
  - Easy to initialize, backup, and inspect.


## 4. Quick Start

- pip install -r requirements.txt
- python ./app.py

Navigate to `http://localhost:5000` for the landing page or use any REST client
against the `/api/*` endpoints.


## 5. Relationship Analysis

- University and Program (1:M)
  - One University can have many Programs (at least one). One Program belongs to only one University.

- ApplicantAccount and Education (1:M)
  - One ApplicantAccount can have many Education records (at least one). One Education record belongs to only one ApplicantAccount.

- University and Education (1:M)
  - One University can be referenced in many Education records (can be zero). One Education record references only one University.

- ApplicantAccount and Scores (1:M)
  - One ApplicantAccount can have many Scores records (can be zero). One Scores record belongs to only one ApplicantAccount.

- ApplicantAccount and Experience (1:M)
  - One ApplicantAccount can have many Experience records (can be zero). One Experience record belongs to only one ApplicantAccount.

- ApplicantAccount and RecommendationLetter (1:M)
  - One ApplicantAccount can have many RecommendationLetter records (can be zero). One RecommendationLetter record belongs to only one ApplicantAccount.

- ApplicantAccount and Publication (1:M)
  - One ApplicantAccount can have many Publication records (can be zero). One Publication record belongs to only one ApplicantAccount. (It could be M:N for authors and publications, but here we only consider the number of publications an application has.)

- ApplicantAccount and Application (1:M)
  - One ApplicantAccount can have many Application records (at least one). One Application record belongs to only one ApplicantAccount.

-  ApplicantAccount and Program (M:N) - (via Application table)
  - One ApplicantAccount can have many applications, which can be associated with many Programs. One Program can be associated with many applications from many ApplicantAccounts.

- ApplicantAccount and Program (1:M) - (via FinalDecisionProgramID)
  - This is a special relationship. One Program can be chosen as the final decision by many ApplicantAccounts (can be zero). One ApplicantAccount can choose one or zero (before the decision deadline) Program as his/her final decision.
