ALTER TABLE `venture` ADD COLUMN `editorStep` INTEGER NOT NULL DEFAULT 1;

CREATE TABLE `group_trial_state` (
  `trialId` VARCHAR(191) NOT NULL,
  `state` JSON NOT NULL,
  `nextTransitionAt` DATETIME(3) NULL,
  PRIMARY KEY (`trialId`),
  INDEX `group_trial_state_nextTransitionAt_idx` (`nextTransitionAt`),
  CONSTRAINT `group_trial_state_trialId_fkey` FOREIGN KEY (`trialId`) REFERENCES `founder_trial` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `group_trial_version` (
  `trialId` VARCHAR(191) NOT NULL,
  `version` INTEGER NOT NULL,
  `terms` JSON NOT NULL,
  PRIMARY KEY (`trialId`, `version`),
  CONSTRAINT `group_trial_version_trialId_fkey` FOREIGN KEY (`trialId`) REFERENCES `group_trial_state` (`trialId`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `venture_email_outbox` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `body` TEXT NOT NULL,
  `path` VARCHAR(191) NOT NULL,
  `attempts` INTEGER NOT NULL DEFAULT 0,
  `availableAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `leaseUntil` DATETIME(3) NULL,
  `leaseToken` VARCHAR(191) NULL,
  `sentAt` DATETIME(3) NULL,
  `failedAt` DATETIME(3) NULL,
  `cancelledAt` DATETIME(3) NULL,
  `reviewTrialId` VARCHAR(191) NULL,
  `reviewRound` INTEGER NULL,
  `failureCode` VARCHAR(191) NULL,
  PRIMARY KEY (`id`),
  INDEX `venture_email_outbox_sentAt_failedAt_availableAt_idx` (`sentAt`, `failedAt`, `availableAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
