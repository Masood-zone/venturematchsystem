-- Additive delta: apply once after 202611090001_idea_text_limits.
ALTER TABLE `student_profile`
  ADD COLUMN `contributionIntro` TEXT NULL,
  ADD COLUMN `teamGoals` TEXT NULL;

CREATE TABLE `venture_application` (
  `id` VARCHAR(191) NOT NULL,
  `ventureId` VARCHAR(191) NOT NULL,
  `applicantUserId` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `profileSnapshot` MEDIUMTEXT NOT NULL,
  `status` ENUM('PENDING','ACCEPTED','DECLINED','WITHDRAWN') NOT NULL DEFAULT 'PENDING',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `respondedAt` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `venture_application_ventureId_applicantUserId_key` (`ventureId`,`applicantUserId`),
  INDEX `venture_application_applicantUserId_status_idx` (`applicantUserId`,`status`),
  INDEX `venture_application_ventureId_status_idx` (`ventureId`,`status`),
  CONSTRAINT `venture_application_ventureId_fkey` FOREIGN KEY (`ventureId`) REFERENCES `venture` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `venture_application_applicantUserId_fkey` FOREIGN KEY (`applicantUserId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
