# Mount Masaba AI Memory Engine

This is the **separate long-term AI memory layer** for Mount Masaba High School.

It is intentionally independent from the school's Supabase application database.

## Architecture

```
18 AI Teachers
      |
   OmniRoute
      |
 AI Memory Engine
      |
  Retrieval / context
      |
  Memory storage
      |
 External object + index storage
```

### Supabase remains the school system

Supabase continues to hold accounts, students, parents, teachers, attendance, results, assignments, school content and permissions.

### This engine holds AI memory

The memory layer is designed for:

- school knowledge
- curriculum knowledge
- uploaded learning documents
- conversation summaries
- learning progress
- misconceptions
- goals
- learning preferences
- AI-relevant long-term context

## Important: 1 TB

GitHub is only the **code host**. It is not the 1 TB memory drive.

The engine uses a storage-provider abstraction so a future 1 TB+ object store can be attached without rebuilding the AI teachers.

The current repository contains a local development store only. A production storage adapter must be configured before storing real student data.

## Memory rules

1. Never put API keys or storage credentials in frontend code.
2. Never put live student memory into Git.
3. Student memory must be isolated by authenticated student ID.
4. AI-generated assumptions should not automatically become permanent memory.
5. Conversation history should be summarized before long-term retention.
6. Memory deletion must remove both the index record and stored content.
7. Large files should be stored as objects; only metadata and searchable indexes should be loaded into AI context.
8. Retrieval should return only the small relevant context needed for a request.

## Designed for large storage

The intended production pattern is:

```
Large document / memory archive
        ↓
chunking + metadata
        ↓
search index
        ↓
top relevant chunks
        ↓
OmniRoute
        ↓
AI teacher
```

This means the AI never needs to load a whole terabyte into a prompt.

## Next production adapter

Configure an S3-compatible object store (or another provider) through server-side environment variables:

- MEMORY_STORAGE_PROVIDER
- MEMORY_OBJECT_ENDPOINT
- MEMORY_OBJECT_BUCKET
- MEMORY_OBJECT_ACCESS_KEY
- MEMORY_OBJECT_SECRET_KEY
- MEMORY_VECTOR_PROVIDER

These values must remain server-side.

The repository deliberately does **not** hard-code a storage vendor so the project can move to a genuinely large/cheap storage provider later.
