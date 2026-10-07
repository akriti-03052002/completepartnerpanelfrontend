# Browser session deployment

Deploy the backend and frontend together. Production browser requests now use `/api` through the Vercel rewrite to the Render backend. Do not remove that rewrite: it keeps HttpOnly cookies first-party.

On Render set `NODE_ENV=production`, `CLIENT_URL` to the production frontend origin (no trailing slash), and `CLIENT_URLS` to a comma-separated list of exact permitted frontend origins, including preview origins you use. Wildcards do not authorize cookie writes. Keep JWT secrets distinct and private.

Local development uses VITE_API_URL. Include the exact development browser origin and port in backend CLIENT_URLS. Browser cookies use HttpOnly and SameSite=Lax; production cookies also use Secure. Each portal has a separate cookie. Existing bearer clients remain compatible; new browser logins do not receive a JWT in the response.

Live checks still required after deployment: register and log in to each portal, refresh protected pages, sign out, verify email links, and test provider sandbox payments/uploads. Use dedicated accounts and Razorpay test mode. Do not test with real charges.
