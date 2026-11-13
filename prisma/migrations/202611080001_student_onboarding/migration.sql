-- AlterTable
ALTER TABLE `capability` ADD COLUMN `createdById` VARCHAR(191) NULL,
    ADD COLUMN `normalizedName` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `student_profile` ADD COLUMN `onboardingGoal` VARCHAR(191) NULL,
    ADD COLUMN `onboardingVentureId` VARCHAR(191) NULL,
    MODIFY `discoverability` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `venture` ADD COLUMN `recruitmentContribution` TEXT NULL,
    ADD COLUMN `weeklyHoursBand` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `availability_option` (
    `id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `capability_normalizedName_key` ON `capability`(`normalizedName`);

-- CreateIndex
CREATE UNIQUE INDEX `student_profile_onboardingVentureId_key` ON `student_profile`(`onboardingVentureId`);

-- AddForeignKey
ALTER TABLE `capability` ADD CONSTRAINT `capability_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_profile` ADD CONSTRAINT `student_profile_onboardingVentureId_fkey` FOREIGN KEY (`onboardingVentureId`) REFERENCES `venture`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
