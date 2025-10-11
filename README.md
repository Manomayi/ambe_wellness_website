# Ambé Wellness Documentation

Complete technical documentation for the Ambé Wellness telemedicine platform.

---

## Quick Start

New to the project? Start here:

1. **[OVERVIEW.md](./OVERVIEW.md)** - Project overview and quick start guide
2. **[SETUP_AND_INSTALLATION.md](./SETUP_AND_INSTALLATION.md)** - Set up your development environment
3. **[AUTHENTICATION_AND_AUTHORIZATION.md](./AUTHENTICATION_AND_AUTHORIZATION.md)** - Understanding the auth system

---

## Core Documentation

### Essential Reading

| Document | Description | Audience |
|----------|-------------|----------|
| **[OVERVIEW.md](./OVERVIEW.md)** | Platform overview, tech stack, project structure | Everyone |
| **[SETUP_AND_INSTALLATION.md](./SETUP_AND_INSTALLATION.md)** | Environment setup, Firebase config, deployment | Developers |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | System architecture, design patterns | Developers |
| **[DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md)** | Firestore schema, collections, relationships | Developers, DBAs |

### Feature Documentation

| Document | Description | Audience |
|----------|-------------|----------|
| **[USER_PORTAL.md](./USER_PORTAL.md)** | User/patient features and workflows | Developers, PMs |
| **[DOCTOR_PORTAL.md](./DOCTOR_PORTAL.md)** | Doctor/provider features and workflows | Developers, PMs |
| **[AUTHENTICATION_AND_AUTHORIZATION.md](./AUTHENTICATION_AND_AUTHORIZATION.md)** | Auth flows, protected routes, security | Developers |
| **[INTEGRATIONS.md](./INTEGRATIONS.md)** | Stripe, Agora, Firebase integrations | Developers |

### Design & UI

| Document | Description | Audience |
|----------|-------------|----------|
| **[UI_UX_DESIGN_SYSTEM.md](./UI_UX_DESIGN_SYSTEM.md)** | Design tokens, components, styling | Developers, Designers |

### Reference

| Document | Description | Audience |
|----------|-------------|----------|
| **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** | Common issues and solutions | Developers |
| **[GLOSSARY.md](./GLOSSARY.md)** | Terms and definitions | Everyone |
| **[FAQ.md](./FAQ.md)** | Frequently asked questions | Developers |

---

## Documentation by Role

### For New Developers

1. [OVERVIEW.md](./OVERVIEW.md) - Understand the platform
2. [SETUP_AND_INSTALLATION.md](./SETUP_AND_INSTALLATION.md) - Get set up
3. [ARCHITECTURE.md](./ARCHITECTURE.md) - Learn the structure
4. [FAQ.md](./FAQ.md) - Common questions answered

### For Frontend Developers

1. [UI_UX_DESIGN_SYSTEM.md](./UI_UX_DESIGN_SYSTEM.md) - Design system
2. [USER_PORTAL.md](./USER_PORTAL.md) - User features
3. [DOCTOR_PORTAL.md](./DOCTOR_PORTAL.md) - Doctor features
4. [AUTHENTICATION_AND_AUTHORIZATION.md](./AUTHENTICATION_AND_AUTHORIZATION.md) - Auth implementation

### For Backend Developers

1. [DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md) - Database schema
2. [AUTHENTICATION_AND_AUTHORIZATION.md](./AUTHENTICATION_AND_AUTHORIZATION.md) - Auth system
3. [INTEGRATIONS.md](./INTEGRATIONS.md) - Third-party services
4. [ARCHITECTURE.md](./ARCHITECTURE.md) - System design

### For Product Managers

1. [OVERVIEW.md](./OVERVIEW.md) - Platform overview
2. [USER_PORTAL.md](./USER_PORTAL.md) - User features
3. [DOCTOR_PORTAL.md](./DOCTOR_PORTAL.md) - Doctor features
4. [GLOSSARY.md](./GLOSSARY.md) - Platform terminology

---

## Documentation Structure

```
docs/
├── README.md                              # This file
│
├── OVERVIEW.md                            # Project overview
├── SETUP_AND_INSTALLATION.md              # Setup guide
├── ARCHITECTURE.md                        # System architecture
├── DATABASE_STRUCTURE.md                  # Database schema
│
├── USER_PORTAL.md                         # User features
├── DOCTOR_PORTAL.md                       # Doctor features
├── AUTHENTICATION_AND_AUTHORIZATION.md    # Auth system
├── INTEGRATIONS.md                        # Third-party services
│
├── UI_UX_DESIGN_SYSTEM.md                 # Design system
│
├── TROUBLESHOOTING.md                     # Common issues
├── GLOSSARY.md                            # Terminology
└── FAQ.md                                 # FAQs
```

---

## Key Features Documented

### User Features
- Health questionnaire
- Doctor matching
- Consultation scheduling
- Video consultations
- Messaging
- Store and shopping
- Subscription management
- Referral program

### Doctor Features
- Verification system
- Schedule management
- User management
- Video consultations
- Consultation reports
- Messaging
- Feedback and ratings

### Technical Features
- Firebase Authentication
- Firestore database
- Stripe payments
- Agora video calls
- Real-time synchronization
- Protected routes
- Role-based access control

---

## Quick Reference

### Common Tasks

| Task | Documentation |
|------|---------------|
| Set up development environment | [SETUP_AND_INSTALLATION.md](./SETUP_AND_INSTALLATION.md) |
| Understand database schema | [DATABASE_STRUCTURE.md](./DATABASE_STRUCTURE.md) |
| Implement new user feature | [USER_PORTAL.md](./USER_PORTAL.md) |
| Implement new doctor feature | [DOCTOR_PORTAL.md](./DOCTOR_PORTAL.md) |
| Add authentication | [AUTHENTICATION_AND_AUTHORIZATION.md](./AUTHENTICATION_AND_AUTHORIZATION.md) |
| Integrate payment | [INTEGRATIONS.md](./INTEGRATIONS.md#stripe-integration) |
| Add video call feature | [INTEGRATIONS.md](./INTEGRATIONS.md#agora-video-integration) |
| Style a component | [UI_UX_DESIGN_SYSTEM.md](./UI_UX_DESIGN_SYSTEM.md) |
| Fix a bug | [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) |

### Code Locations

| Feature | Location |
|---------|----------|
| Authentication context | `src/contexts/AuthContext.jsx` |
| Firebase config | `src/lib/firebase/config.js` |
| Design tokens | `src/lib/design-tokens.js` |
| User portal | `src/app/(dashboard)/user/` |
| Doctor portal | `src/app/(dashboard)/doctor/` |
| Components | `src/components/` |

---

## Contributing to Documentation

### When to Update

- Adding new features
- Changing existing functionality
- Finding errors or omissions
- Improving clarity

### How to Update

1. Edit relevant `.md` file
2. Keep consistent formatting
3. Update "Last Updated" date
4. Cross-reference related docs
5. Test code examples

---

## Getting Help

### Documentation Issues

If documentation is unclear, incomplete, or incorrect:
1. Check related documentation files
2. Review code examples
3. Consult [FAQ.md](./FAQ.md)
4. Report issue or suggest improvement

### Technical Issues

For technical problems:
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review related feature documentation
3. Check browser console for errors
4. Review Firebase/Stripe/Agora logs

---

## Additional Resources

### External Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Agora Docs](https://docs.agora.io)

### Project Files

- `CLAUDE.md` - Project instructions for AI assistants
- `package.json` - Dependencies and scripts
- `jsconfig.json` - Path aliases and configuration
- `tailwind.config.js` - Tailwind configuration

---

## Version History

**v1.0** - October 2025
- Initial comprehensive documentation
- All core features documented
- Complete setup guide
- Troubleshooting guide
- Design system documentation

---

**Happy Coding!** 🚀

For questions or suggestions, refer to the appropriate documentation file or reach out to the development team.
