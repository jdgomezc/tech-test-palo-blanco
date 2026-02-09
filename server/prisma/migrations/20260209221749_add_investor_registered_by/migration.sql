-- Add column as nullable first for existing rows
ALTER TABLE `Investor` ADD COLUMN `registeredById` INTEGER NULL;

-- Backfill: set to first user id for existing investors
UPDATE `Investor` SET `registeredById` = (SELECT `id` FROM `User` ORDER BY `id` LIMIT 1) WHERE `registeredById` IS NULL;

-- Make column required
ALTER TABLE `Investor` MODIFY COLUMN `registeredById` INTEGER NOT NULL;

-- Add foreign key
ALTER TABLE `Investor` ADD CONSTRAINT `Investor_registeredById_fkey` FOREIGN KEY (`registeredById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
