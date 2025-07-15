# Game Engine

A TypeScript-based game development simulation engine for software project management scenarios.

## Overview

This engine simulates software development projects with features, defects, testing, and project management mechanics. It's designed for educational or gaming purposes to understand software development lifecycle challenges.

## Core Components

- **Game**: Main game controller managing multiple projects
- **Project**: Individual software projects with backlogs and defects
- **Feature**: Development tasks that can generate defects when completed
- **Defect**: Bugs that can be found through testing with varying stealth levels
- **Testing**: Comprehensive testing system with different strategies
- **Task**: Base class for all work items

## Getting Started

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Watch for changes during development
npm run watch

# Clean build
npm run rebuild
```

## Usage

```typescript
import { Game } from './dist/Game.js';

const game = new Game();
const project = game.createProject(1, 'My Project');
const features = game.generateFeatures(project, 5);
```

## Development

This project uses TypeScript with ES2022 modules. All source files are in `src/` and compiled output goes to `dist/`.

## License

ISC
