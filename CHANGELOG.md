# Refactor: Error Handling – invoice.controller.ts

- Replaced all `throw new AppError(...)` with `return next(new AppError(...))`
- Ensured centralized error flow via errorHandler.ts
- Verified consistency in `importFromLocal`, `importDataFromAttachment`, and `importFromUrl`
