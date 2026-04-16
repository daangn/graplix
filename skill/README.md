# Graplix Skill

Agent skill for the [Graplix](https://github.com/daangn/graplix) TypeScript ReBAC (Relation-Based Access Control) toolkit.

Graplix Skills are folders of instructions and resources that coding agents can discover and use to gain Graplix knowledge. They contain setup instructions, best practices, and methods for retrieving current documentation.

## Installation

Install using any coding agent that supports the [Skills standard](https://agentskills.io):

```bash
npx skills add daangn/graplix
```

```bash
pnpm dlx skills add daangn/graplix
```

```bash
yarn dlx skills add daangn/graplix
```

```bash
bun x skills add daangn/graplix
```

## Compatibility

Works with any coding agent that supports the Skills standard, including:

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)
- [Cursor](https://cursor.com)
- [Codex](https://openai.com/codex)
- [OpenCode](https://opencode.ai)

Also available on [GitHub](https://github.com/daangn/graplix).

## What's Included

- **SKILL.md** - Core Graplix knowledge: schema syntax, buildEngine, resolvers, resolveType, check/explain, and critical rules
- **references/quick-start.md** - Installation and first permission check guide
- **references/schema-syntax.md** - `.graplix` schema language reference
- **references/embedded-docs.md** - How to find API documentation in installed packages
- **references/common-errors.md** - Troubleshooting guide for frequent errors

## License

MIT
