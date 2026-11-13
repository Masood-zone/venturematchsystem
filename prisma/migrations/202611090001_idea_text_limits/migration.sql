-- Match the onboarding form's 500-character problem and 300-character audience.
-- Widening existing columns preserves their contents.
ALTER TABLE `venture` MODIFY `problem` TEXT NULL,
  MODIFY `targetUsers` TEXT NULL;
