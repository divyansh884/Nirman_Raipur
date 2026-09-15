# Nirman Raipur: Interview Preparation Knowledge Base (Part 5 - 9)

> [!IMPORTANT]
> This document is designed for rigorous, BlackRock/Amazon-style interview preparation. Every technical decision is justified with internal workings, scaling, and failure cases.
> *Verify exact implementation details (e.g. JWT storage method) in your codebase before the interview.*

---

## PART 5 — FRONTEND (React + Zustand + Leaflet)

### 5.1 React & Component Lifecycle
**1. One-line definition:** A JavaScript library for building user interfaces using a declarative, component-based paradigm.
**2. Interview-level explanation:** "I built the dashboard in React to manage the complex, highly interactive UI state—like filtering a map of construction sites while updating a sidebar list of works. React's Virtual DOM ensures only the changed elements re-render, keeping the dashboard snappy even with hundreds of DOM nodes."
**5. How does it work internally?** React maintains a Virtual DOM in memory. When state changes, it calculates the difference (Reconciliation/Diffing algorithm) and updates the actual browser DOM in a batch.
**9. Failure cases:** Unnecessary re-renders causing lag. E.g., placing an expensive API call directly in the component body instead of inside a `useEffect` with a strict dependency array.

### 5.2 Zustand (Global State Management)
**1. One-line definition:** A small, fast, and scalable bearbones state-management solution using simplified flux principles.
**2. Interview-level explanation:** "In Nirman Raipur, I needed to share the authenticated user's profile and the active 'filter criteria' across multiple deeply nested components (Sidebar, Map, Table). Passing props down 5 levels (prop drilling) was messy. I used Zustand."
**3. Why did I use it?** It's significantly lighter and less boilerplate-heavy than Redux.
**4. Why not alternatives?** 
- *Redux:* Requires actions, reducers, and providers. Massive boilerplate for a simple dashboard.
- *React Context:* Context is good for dependency injection, but bad for high-frequency state updates. If one value in a Context provider changes, *every* component consuming that context re-renders, causing performance issues. Zustand allows selecting specific slices of state to prevent re-renders.
**6. Implementation-level details:** Created a hook `useStore = create((set) => ({ ... }))`.
**13. Interview questions:**
- *Medium:* "Why Zustand instead of Redux or Context?"
- *Hard:* "How did you manage loading and error states across the dashboard?"
**14. Model answers:** "For server state (data fetched from APIs), I ideally prefer tools like React Query because they handle caching, retries, and loading states automatically. However, for client-side UI state like 'Is Sidebar Open' or 'Selected Map Marker', Zustand is perfect because it hooks directly into components without wrapping the whole app in Providers like Redux."

### 5.3 React-Leaflet (Geospatial Mapping)
**1. One-line definition:** React components for Leaflet maps, used to plot construction sites.
**2. Interview-level explanation:** "Visualizing data geographically is crucial for administration. I integrated React-Leaflet to plot works based on lat/lng coordinates."
**7. Complexity:** Rendering thousands of SVG markers in the DOM is O(N) memory and kills browser performance.
**10. Scaling:** If plotting 10,000 work sites, the browser DOM will crash. I would implement Marker Clustering (grouping nearby markers into a single icon with a number) or use WebGL-based mappers like Mapbox GL JS if scaling gets extreme.
**13. Interview questions:**
- *Hard:* "How does React-Leaflet render thousands of map markers without lagging?" -> *Answer:* Use Marker Clustering or canvas rendering instead of individual SVG DOM elements.

### 5.4 Axios Interceptors
**2. Interview-level explanation:** "To avoid attaching the JWT token manually to every API call, I used Axios Interceptors. It acts as middleware for outgoing requests and incoming responses."
**9. Failure cases:** Token expiration.
**13. Interview questions:**
- *Hard:* "How did you handle expired JWT tokens on the frontend?"
**14. Model answers:** "I used an Axios response interceptor. If the API returns a 401 Unauthorized, the interceptor catches it. It then checks if a refresh token exists, calls the `/refresh` endpoint, gets a new token, updates Zustand/LocalStorage, and retries the original failed request seamlessly. If that fails, it redirects the user to the Login page."

---

## PART 6 — SECURITY & AUTHENTICATION (JWT)

### 6.1 JWT (JSON Web Tokens)
**1. One-line definition:** An open, industry standard for representing claims securely between two parties.
**2. Interview-level explanation:** "Nirman Raipur is stateless. Instead of storing session IDs in a MongoDB collection (which requires a DB lookup on every request), the server issues a JWT upon login. The JWT contains the user's ID and Role, cryptographically signed."
**5. How does it work internally?** 3 parts separated by dots: Header (alg: HS256), Payload (data), Signature (Hash of Header + Payload + Secret Key).
**8. Trade-offs:** Because JWTs are stateless, they cannot be invalidated instantly on the server side unless you maintain a "blacklist" in Redis (which defeats the purpose of being stateless).
**11. Security considerations:** 
- *Local Storage vs Cookies:* Storing JWT in `localStorage` exposes it to XSS (Cross-Site Scripting) attacks where malicious JS can steal the token. Storing in an `HttpOnly` Cookie prevents XSS but opens up CSRF (Cross-Site Request Forgery) attacks.
**13. Interview questions:**
- *Medium:* "How does the server know a JWT wasn't tampered with?"
- *Hard:* "If an Admin is fired, how do you instantly revoke their JWT before it expires?"
**14. Model answers:**
*Tampering:* "When a client sends the JWT, the server takes the Header and Payload from the token, and re-signs it using its secret `JWT_SECRET`. If the resulting signature matches the signature attached to the token, it's valid. If an attacker changes their role from 'engineer' to 'admin' in the payload, the signatures will not match because the attacker doesn't know the secret key."
*Revocation:* "Stateless JWTs are hard to revoke. If an admin is fired, their token is still mathematically valid for 1 hour. To fix this, I can either: 1) Implement a fast Redis blocklist for revoked tokens. 2) Keep JWT expiration very short (5 minutes) and rely on refresh tokens (which are validated against the DB)."

### 6.2 Application Security (Helmet, Rate Limiting)
**12. Testing & Debugging:**
- **Helmet:** Sets 14+ security headers. Most importantly, it sets CSP (Content Security Policy) to prevent XSS, and `X-Frame-Options` to prevent Clickjacking (putting the site in a hidden iframe).
- **Rate Limiting:** `express-rate-limit` keeps an in-memory dictionary of IPs. *Trade-off:* If I scale to 3 Node servers behind a load balancer, in-memory rate limiting fails. I must switch to a Redis-backed rate limiter.
**13. Interview questions:**
- *Hard:* "Explain a SQL/NoSQL Injection attack and how your app prevents it." -> *Answer:* In Mongo, an attacker might send `{"$gt": ""}` as a password to bypass auth. Mongoose automatically casts variables to strings/types, mitigating standard NoSQL injection, and `express-validator` sanitizes raw inputs.

---

## PART 7 — TESTING (Jest + Supertest)

**1. One-line definition:** Jest is a test runner and assertion library; Supertest is used to test HTTP assertions.
**2. Interview-level explanation:** "To ensure API reliability, I wrote integration tests using Supertest. It spins up the Express app internally without binding to a network port and fires HTTP requests at the routes."
**5. How does it work internally?** Used `mongodb-memory-server` in the `beforeAll` block. This downloads an actual MongoDB binary and runs it in RAM. 
**3. Why did I use it?** It provides a real database environment for Mongoose models without affecting the development or production database.
**13. Interview questions:**
- *Medium:* "How do you ensure test isolation?" -> *Answer:* By dropping all collections in `afterEach` and destroying the memory DB in `afterAll`.
- *Hard:* "How did you test file uploads in Jest?" -> *Answer:* Supertest has a `.attach('photo', 'path/to/mock_image.jpg')` method that simulates a multipart form upload. I mock the AWS S3 SDK using `jest.mock()` so tests don't make real network calls to AWS, saving money and speeding up tests.

---

## PART 8 — SCALING & SYSTEM DESIGN

**Scenario: Design Nirman Raipur for the entire country (100x scale, 1M historical records, high concurrency).**

1. **Database Bottleneck:** MongoDB on a single instance will choke. 
   *Solution:* Horizontal scaling via Sharding. Shard key could be `state_id` or `district_id`, ensuring queries for a specific district route to a specific shard.
2. **Analytics/Reports Bottleneck:** The Aggregation Pipeline calculating "Pending works across all districts" will scan millions of rows and take 10 seconds, locking DB resources.
   *Solution:* Implement Redis caching. A cron job runs the aggregation every 1 hour and stores the JSON result in Redis. The API serves reports from Redis in O(1) time (10ms).
3. **Photo Storage:** 
   *Solution:* AWS S3 is already scalable. To reduce AWS bandwidth costs and improve load times, put an AWS CloudFront CDN in front of S3.
4. **API Scaling:** 
   *Solution:* Containerize the Node app with Docker. Deploy on Kubernetes (AWS EKS) or ECS. Put AWS Application Load Balancer (ALB) in front to distribute traffic among Node pods.

---

## PART 9 — RESUME CROSS-EXAMINATION & STRESS TEST

*These are rapid-fire, aggressive questions an interviewer might use to test your actual understanding.*

**Stress Test 1: Node vs Threads**
*Interviewer:* "You said Node handles high concurrency. But a single thread can only do one thing at a time. How does it handle 1,000 users uploading photos simultaneously?"
*Response:* "Node is single-threaded for JS execution, but I/O operations (like file system or network) are handed off to the OS kernel or libuv's thread pool. Node doesn't wait for the file to upload; it registers a callback and moves to the next user request. However, if I used `multer.memoryStorage()`, 1,000 uploads would exhaust the RAM. That's why at scale, we use S3 Presigned URLs to bypass Node entirely."

**Stress Test 2: React State Sync**
*Interviewer:* "You used Zustand. What happens if a user is viewing a Work Order on the dashboard, and an engineer in the field updates its status to 'Completed'. Does the dashboard update? If not, aren't you showing stale data?"
*Response:* "Currently, the dashboard only updates when refreshed or when a component remounts and triggers a new API call. Zustand handles client-side state, not server state syncing. To fix this, I would implement WebSockets (Socket.io) for real-time events, or use Server-Sent Events (SSE) since it's a one-way update from Server to Client. Alternatively, I could use React Query with a polling interval."

**Stress Test 3: System Integrity**
*Interviewer:* "You said you use MongoDB. But government tenders are highly relational. What if an Admin approves a Tender, and the system needs to simultaneously generate a Work Order and deduct the Budget. If the server crashes between those steps in MongoDB, you have corrupted state."
*Response:* "That's a valid concern with NoSQL. Prior to MongoDB 4.0, there were no multi-document ACID transactions. Today, I can use `session.startTransaction()` to wrap those multiple operations. If the server crashes mid-way, MongoDB automatically rolls back the Tender approval. If the project required heavy transactional logic from day one, PostgreSQL would have been a better choice."

**Stress Test 4: "Did you actually build this?"**
*Interviewer:* "Did you implement the map yourself? How exactly do you pass coordinate data from the backend to Leaflet?"
*Response:* "Yes. The backend stores location as a GeoJSON object or simple `{ lat, lng }` fields in the Work model. The React component fetches this array. I iterate over the array using `.map()` and render a `<Marker position={[work.lat, work.lng]}>` component from React-Leaflet inside the `<MapContainer>`."
