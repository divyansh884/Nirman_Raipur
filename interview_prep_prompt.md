I am preparing for a rigorous software engineering placement interview (e.g., BlackRock). The interview will heavily scrutinize my resume, projects, technical decisions, and follow-up questions rather than just standard DSA.

I want you to act as an expert interviewer and technical mentor. Create a deep interview-preparation knowledge base from my primary project: **Nirman Raipur**.

**Project Context (Nirman Raipur):**
A comprehensive web platform (Frontend + Backend API) for managing district-level construction work progress, orders, tenders, and administrative approvals. 
Tech Stack: React.js (Vite), Zustand, Tailwind CSS, React-Leaflet (Maps), Node.js, Express.js, MongoDB (Mongoose), AWS SDK (S3 for photos), JWT (Passport), Multer, Jest & Supertest.
Features: Work tracking, Tender management, Photo uploads, Advanced filtering/pagination, Analytics reports (aggregation), Security (Helmet, Rate Limiting), Geospatial map views.

The most important principle is:
«Anything I have written on my resume regarding this project must be defensible at the level of implementation, design decisions, internals, trade-offs, complexity, failure cases, and scaling.»

---
GLOBAL FORMAT FOR EVERY TOPIC
For every technology/concept/feature, provide:
1. One-line definition
2. Interview-level explanation (natural speaking style)
3. Why did I use it? (Crucial)
4. Why not alternatives? (e.g., Why MongoDB instead of PostgreSQL? Why Zustand instead of Redux?)
5. How does it work internally? 
6. Implementation-level details
7. Complexity (Time/Space where applicable)
8. Trade-offs
9. Failure cases (What goes wrong?)
10. Scaling (10x users, 1M records, high concurrent traffic)
11. Security considerations
12. Testing & Debugging (Realistic bugs and fixes)
13. Interview questions (Easy, Medium, Hard, Follow-up/Traps)
14. Model answers
15. Cross-question connections

---

### PART 1 — PROJECT UNDERSTANDING & ARCHITECTURE

Explain deeply:
- What exact problem Nirman Raipur solves for the district administration.
- Complete end-to-end architecture (Client -> Express -> MongoDB/AWS).
- The exact lifecycle of an HTTP request in this system (e.g., uploading a work progress photo).

I should be able to answer:
«"Explain Nirman Raipur to me in 30 seconds."»
«"Walk me through what happens when an engineer uploads a progress report with a photo."»
«"Draw the system architecture."»

---

### PART 2 — BACKEND & API DESIGN (Node.js + Express)

Prepare the complete tree for:
- Event Loop & Asynchronous execution in Node.js
- Express Middleware pipeline (Order of execution)
- REST API design principles (Nouns, Verbs, Status Codes)
- Advanced Filtering, Sorting, and Pagination implementation
- File Uploads (Multer + Streams)

Questions to prepare for:
- "Why Express over NestJS or fastify?"
- "How exactly did you implement pagination? Offset-based or Cursor-based? What are the trade-offs?"
- "What happens if a user uploads a 5GB file? How does Multer handle it?"
- "How do you handle unhandled promise rejections in Node?"

---

### PART 3 — DATABASE & MODELING (MongoDB)

This is a critical area. Prepare deeply:
- NoSQL vs SQL decision for this specific project.
- Document modeling: Referencing vs Embedding (e.g., linking a Tender to a Work Order).
- MongoDB Aggregation Pipeline (Specifically for the Reports feature: agency-wise, block-wise, scheme-wise).
- Indexing (B-Trees, Compound indexes for filtering by Area + Scheme).
- Mongoose ODM lifecycle hooks and population.

Questions to prepare for:
- "Why MongoDB instead of PostgreSQL for a structured system like government tenders?"
- "Explain the exact aggregation pipeline you used to generate the 'Pending Works' report."
- "If I search for works by 'Block' and 'Status', how should the index be structured?"
- "What is the N+1 query problem in Mongoose and how did you solve it?"

---

### PART 4 — CLOUD STORAGE (AWS S3)

Prepare:
- Object Storage vs Block Storage
- AWS SDK integration
- Presigned URLs for secure uploads/downloads
- Multipart uploads

Questions to prepare for:
- "Why store photos in S3 instead of MongoDB as Base64 or on the local server disk?"
- "How do you ensure private photos aren't publicly accessible on S3?"
- "What happens if the MongoDB document saves successfully, but the S3 upload fails? Or vice versa?"

---

### PART 5 — FRONTEND (React + Zustand + Leaflet)

Prepare:
- React component lifecycle & rendering optimization
- Zustand (Global state management)
- Map integrations (React-Leaflet, Geospatial rendering)
- Axios interceptors

Questions to prepare for:
- "Why Zustand instead of Redux or React Context?"
- "How does React-Leaflet render thousands of map markers without lagging?"
- "How did you handle expired JWT tokens on the frontend?"
- "Explain how you managed loading and error states across the dashboard."

---

### PART 6 — SECURITY & AUTHENTICATION (JWT)

Prepare deeply:
- JWT structure (Header, Payload, Signature)
- Passport-JWT strategy
- Token storage (Local Storage vs HttpOnly Cookies - trade-offs)
- Rate Limiting (express-rate-limit) & Helmet headers
- bcryptjs hashing

Questions to prepare for:
- "How does the server know a JWT wasn't tampered with?"
- "If an Admin is fired, how do you instantly revoke their JWT before it expires?"
- "What specific attacks does Helmet prevent?"
- "Explain a SQL/NoSQL Injection attack and how your app prevents it."

---

### PART 7 — TESTING (Jest + Supertest)

Prepare:
- Unit vs Integration Testing
- Supertest API mocking
- mongodb-memory-server (Why use an in-memory DB for tests?)

Questions to prepare for:
- "How did you test file uploads in Jest?"
- "What is your testing strategy for database-heavy aggregation endpoints?"
- "How do you ensure test isolation?"

---

### PART 8 — SCALING & SYSTEM DESIGN

Ask me to design Nirman Raipur for:
- The entire state/country (100x scale)
- Millions of historical work orders
- Thousands of engineers uploading photos simultaneously

Discuss:
- Caching (Redis for the aggregation reports)
- Database scaling (Replica sets, Sharding on 'Block' or 'District')
- Load Balancing
- CDN for map tiles and S3 photos

---

### PART 9 — RESUME CROSS-EXAMINATION & STRESS TEST

Act like a skeptical BlackRock interviewer.
For every feature mentioned above, generate:
1. Basic question
2. Why question
3. How question
4. Internals question
5. Alternative question
6. Trade-off question
7. Failure question
8. Scaling question
9. Security question
10. "Did you actually build this?" question

Example Stress Test:
Interviewer: "Why did you use MongoDB?"
Candidate: "Because of flexible schemas."
Interviewer: "But government tenders and work orders are highly relational and rigid. Doesn't MongoDB lack ACID compliance across multiple collections? How did you handle a transaction where a tender is approved AND a work order is generated simultaneously?"
(Continue drilling until exhausted).

---
IMPORTANT OUTPUT REQUIREMENTS
Do NOT give me a shallow tutorial. I am using this material for an actual interview.
For every important concept, provide: Concept → Intuition → Internals → Implementation → Complexity → Trade-offs → Failure cases → Scaling → Interview questions → Follow-ups.
Do not fabricate implementation details. If something is ambiguous based on my stack, flag it as "Verify this in your actual codebase before the interview."
