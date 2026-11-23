# pi-dev — Agentic Coding Harness

Mi harness de desarrollo con agentes, compartido entre **Pi** (`~/.pi/agent/`) y **Antigravity CLI (`agy`)** (`~/.gemini/`), orquestado dentro de **bb**.

## Estructura del repositorio

```text
pi-dev/
├── pi/                     # Espejo limpio de ~/.pi/agent/
│   ├── AGENTS.md           # Reglas globales (git worktrees, YAGNI, TDD, PRs, modo ADHD)
│   ├── settings.json       # Paquetes, modelo por defecto y observational memory
│   ├── mcp.json            # MCP servers (ClickUp, Toggl vía macOS Keychain)
│   ├── web-search.json     # Routing de búsqueda web
│   ├── i-have-adhd.json    # Modo comunicación ADHD siempre activo
│   ├── agents/             # implementer, reviewer, simplify-reviewer
│   ├── skills/             # grilling, plan, review-plan, implement, create-pr, finish, ...
│   ├── prompts/            # tdd-1..6, explore, simplify, review-tests, session-retro, ...
│   ├── extensions/         # english-coach, bash-minimal, read-minimal, cockpit, plan-usage, ...
│   ├── patches/            # Parche de advisor notice para pi-claude-bridge
│   └── themes/             # minimal, nightowl
├── gemini/                 # Espejo limpio de ~/.gemini/
│   ├── AGENTS.md           # Importa ~/.pi/agent/AGENTS.md + i-have-adhd + mapeo Antigravity
│   └── config/
│       ├── agents/         # implementer, reviewer, simplify-reviewer adaptados a agy
│       ├── hooks.json      # Hook PreInvocation para english-coach
│       ├── hooks/          # english-coach.sh
│       └── skills.json     # Rutas de skills compartidos
├── shared-skills/          # Skills compartidos de ~/.agents/skills/ (domain-modeling, prototype, research, wayfinder)
└── scripts/
    └── sync.sh             # Actualiza este repo desde ~/.pi/agent/, ~/.gemini/ y ~/.agents/skills/
```

## Cómo funciona el workflow

La sesión principal coordina y revisa, pero **nunca edita código del repo directamente**:

1. **`/skill:grilling`** — entrevista en rondas sobre el árbol de decisiones hasta eliminar ambigüedades.
2. **`/skill:plan`** — escribe el plan más simple posible en `~/.pi/agent/plans/<repo>/<feature>.md`.
3. **`/skill:review-plan`** — valida rutas, comandos y decisiones antes de escribir código.
4. **`/skill:implement`** — crea un git worktree aislado y coordina tres subagentes en rondas:
   - `implementer` (TDD estricto, 1 commit por tarea, minimización de tests).
   - `reviewer` (solo lectura: calidad, seguridad y correctitud).
   - `simplify-reviewer` (solo lectura: valida si es la solución más simple).
5. **`/skill:create-pr`** — abre el PR como draft asignado a `@me`.
6. **`/skill:finish`** — convierte errores repetidos en checks deterministas, limpia el worktree y cierra la tarea.

## Cómo actualizar este repo con cambios locales

Ejecuta el script de sincronización (usa lista blanca estricta; nunca copia credenciales, `sessions/`, `plans/` ni logs):

```bash
./scripts/sync.sh
git status
git add -A && git commit -m "Sync harness" && git push
```

## Qué queda excluido a propósito

Nunca se versionan credenciales, skills internos de trabajo ni estado efímero de máquina:
`auth.json`, `mcp-auth.json`, `models-store.json`, `trust.json`, `claude-bridge.json`, `pi/skills/semantix/`, `*.log`, `sessions/`, `plans/`, `cc-cli-logs/`, `web-search-cache/`, `npm/`, `git/`, `bin/`, `install/` ni `~/.gemini/antigravity-cli/`. `scripts/sync.sh` también reemplaza la ruta local de `$HOME` por `~` antes de guardar.
