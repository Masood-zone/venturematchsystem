-- Preserve incomplete step input separately from validated profile/venture data.
ALTER TABLE `student_profile` ADD COLUMN `onboardingDraftJson` TEXT NULL,
  MODIFY `onboardingStep` VARCHAR(191) NOT NULL DEFAULT 'goal';
-- Case normalization is application-owned; keep accents/punctuation distinct.
DROP INDEX `capability_normalizedName_key` ON `capability`;
ALTER TABLE `capability` MODIFY `normalizedName` VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL;
CREATE UNIQUE INDEX `capability_normalizedName_key` ON `capability`(`normalizedName`);
