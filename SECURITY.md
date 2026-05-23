# Security Policy

## Supported Versions

| Version | Supported |
|---------|----------|
| 0.x     | ✅ (current) |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email the maintainers with details
3. Include steps to reproduce if possible
4. Allow reasonable time for a fix before disclosure

## Security Considerations

Xevu is a **read-only analysis tool**. It:
- Never modifies user code
- Never executes user code
- Never sends data to external servers
- Runs entirely locally via stdio transport
- Only reads `.ts`, `.tsx`, `.js`, `.jsx`, and `package.json` files
