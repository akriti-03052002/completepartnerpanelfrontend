Google / YouTube connection configuration

In Google Cloud Console, open Google Auth Platform > Clients (or APIs & Services > Credentials), then the Web application OAuth client matching the backend's GOOGLE_CLIENT_ID.

Add this exact Authorized redirect URI:

https://completepartnerpanelbackend.onrender.com/api/partner/social/youtube/callback

For local development, add the local backend callback too, using the port configured by API_PUBLIC_URL, for example:

http://localhost:5000/api/partner/social/youtube/callback

On Render, set API_PUBLIC_URL to https://completepartnerpanelbackend.onrender.com and use the same OAuth client's GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET. CLIENT_URL is the frontend URL used after the callback; it is separate from the Google callback URL.

Save the Google client settings. Redeploy the backend if environment values changed, then start a fresh YouTube connection. Adding JavaScript origins alone does not authorize the callback URI.

If the Google app is in testing mode, add the connecting Google account as a test user. This addresses access to the testing app; the redirect URI must still match exactly.

The code cannot register a redirect URI in your Google Cloud project. That change must be made in the console for the matching OAuth client.
