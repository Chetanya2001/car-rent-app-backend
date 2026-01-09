Zipdrive Architecture Principles:

This document outlines the guiding principles for the architecture of the Zipdrive (Node.js/Express backend on AWS EC2). These principles prioritize sustainability, clarity, and incremental evolution over premature complexity. Update as the system evolves; see ADRs for specific decisions.

Context:

The project handles 16 models with MySQL/MongoDB, focusing on clear ownership amid ongoing development, CI/CD via GitHub Actions, and AWS deployment (EC2, RDS, S3). Principles enforce boundaries to support refactoring without chaos.

Guiding Principles:

What We Are NOT Doing (Avoidances)

These prevent over-engineering and technical debt:

❌ Building microservices – Stick to monolith for simplicity.
❌ Over-optimizing performance – Profile first, optimize later.
❌ Refactoring all 16 models at once – Incremental changes only.
❌ Introducing fancy infra (CQRS, Event Sourcing) – No until proven necessary.

What We ARE Doing (Commitments):

✅ Creating clear boundaries – Explicit module ownership and interfaces.
✅ Enforcing ownership – Assign leads per model/feature.
✅ Preventing future chaos – Strict PR reviews, tests, and docs.
✅ Refactoring incrementally – One model/feature per cycle.
