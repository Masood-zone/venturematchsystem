// Expected domain failures shared by the student-facing services.
export class StudentServiceError extends Error {
  constructor(message: string, public status = 409) { super(message); }
}
