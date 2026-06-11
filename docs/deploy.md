# Deployment Notes

## Early Stage

The project is not ready for production deployment yet.

The first deployment target should be a web preview after the map prototype exists. The mini program should wait until the core interaction and data model are stable.

## Web Preview

Possible web preview targets:

- Vercel
- Cloudflare Pages
- GitHub Pages, if the app can be exported statically

The exact target will be chosen after the Taro + React setup is initialized.

## Backend Deployment

The Go API can initially run locally with SQLite.

For a real mini program release, the backend will need:

- HTTPS domain
- Server or cloud hosting
- Database backup strategy
- Environment variable management
- Object storage for uploaded images

## WeChat Mini Program Release Preparation

Before publishing the mini program, prepare:

- WeChat mini program account
- Mini program filing and review materials
- Privacy policy
- User agreement
- HTTPS request domain configuration
- Upload domain configuration
- Image safety check workflow
- User data deletion path

The safest first release should keep uploaded content private to the user.

