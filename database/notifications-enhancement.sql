-- Enhancement for notifications table to support Emergency/Routine workflows
-- Add user_id and priority columns to support admin and adviser notifications

ALTER TABLE `notifications` 
ADD COLUMN `user_id` int(10) UNSIGNED DEFAULT NULL AFTER `parent_id`,
ADD COLUMN `priority` enum('normal','urgent') DEFAULT 'normal' AFTER `status`,
ADD KEY `fk_notif_user` (`user_id`);

-- Add foreign key constraint for user_id
ALTER TABLE `notifications`
ADD CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

-- Update the channel enum to include 'System' for internal notifications
ALTER TABLE `notifications` 
MODIFY COLUMN `channel` enum('SMS','Email','System') DEFAULT 'SMS';