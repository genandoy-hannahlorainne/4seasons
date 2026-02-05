-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 05, 2026 at 09:26 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `4seasons`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `log_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `action` varchar(150) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`log_id`, `user_id`, `action`, `details`, `ip_address`, `created_at`) VALUES
(420, 28, 'Registration', NULL, '::1', '2026-02-01 10:17:20'),
(421, 28, 'Login', NULL, '::1', '2026-02-01 10:17:28'),
(422, 29, 'Registration', NULL, '::1', '2026-02-01 10:18:25'),
(423, 29, 'Login', NULL, '::1', '2026-02-01 10:18:34'),
(424, 29, 'View Notifications', 'Viewed adviser notifications - 0 notifications', '::1', '2026-02-01 10:18:37'),
(425, 29, 'View Notifications', 'Viewed adviser notifications - 0 notifications', '::1', '2026-02-01 10:18:37'),
(426, 28, 'Login', NULL, '::1', '2026-02-01 10:19:13'),
(427, 28, 'Update Physical Info', 'Updated physical information (height, weight, BMI, blood type)', '::1', '2026-02-01 10:19:28'),
(428, 29, 'Login', NULL, '::1', '2026-02-01 10:20:53'),
(429, 28, 'Login', NULL, '::1', '2026-02-01 10:21:14'),
(430, 28, 'Update Physical Info', 'Updated physical information (height, weight, BMI, blood type)', '::1', '2026-02-01 10:26:36'),
(431, 28, 'Update Allergies', 'Updated allergies list - 0 allergies saved', '::1', '2026-02-01 10:26:44'),
(432, 28, 'Update Allergies', 'Updated allergies list - 1 allergies saved', '::1', '2026-02-01 10:26:55'),
(433, 32, 'Login', NULL, '::1', '2026-02-01 12:12:58'),
(434, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:12:59'),
(435, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:12:59'),
(436, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:13:05'),
(437, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:13:05'),
(438, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:13:36'),
(439, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:14:06'),
(440, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:14:36'),
(441, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:15:06'),
(442, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:15:36'),
(443, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:16:06'),
(444, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:17:32'),
(445, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:17:43'),
(446, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:17:43'),
(447, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:18:14'),
(448, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:18:44'),
(449, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:19:27'),
(450, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:19:44'),
(451, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:20:14'),
(452, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:22:41'),
(453, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:22:44'),
(454, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:23:15'),
(455, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:23:44'),
(456, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:24:14'),
(457, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:24:44'),
(458, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:25:14'),
(459, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:25:44'),
(460, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:26:14'),
(461, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:26:44'),
(462, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:27:14'),
(463, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:27:23'),
(464, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:27:24'),
(465, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:27:31'),
(466, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 12:27:31'),
(467, 28, 'Login', NULL, '::1', '2026-02-01 12:28:02'),
(468, 32, 'Login', NULL, '::1', '2026-02-01 12:30:27'),
(469, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:30:28'),
(470, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:30:28'),
(471, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:30:59'),
(472, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:31:29'),
(473, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:31:59'),
(474, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:32:35'),
(475, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:32:59'),
(476, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:33:29'),
(477, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:34:35'),
(478, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:35:06'),
(479, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:35:06'),
(480, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:35:37'),
(481, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:36:07'),
(482, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:36:37'),
(483, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:37:07'),
(484, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:37:37'),
(485, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:38:07'),
(486, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:39:29'),
(487, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:40:29'),
(488, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:41:29'),
(489, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:42:29'),
(490, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:42:48'),
(491, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:42:48'),
(492, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:43:19'),
(493, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:43:48'),
(494, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:43:59'),
(495, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:43:59'),
(496, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:44:29'),
(497, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:44:59'),
(498, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:45:29'),
(499, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:45:59'),
(500, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:46:29'),
(501, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:46:59'),
(502, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:47:29'),
(503, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:47:59'),
(504, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:48:29'),
(505, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:48:41'),
(506, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:48:41'),
(507, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:49:02'),
(508, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:49:02'),
(509, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:49:14'),
(510, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:49:14'),
(511, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:49:44'),
(512, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:50:14'),
(513, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:50:54'),
(514, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:51:14'),
(515, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:51:44'),
(516, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:52:14'),
(517, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:52:44'),
(518, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:53:29'),
(519, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:54:30'),
(520, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:54:48'),
(521, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:54:51'),
(522, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:54:51'),
(523, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:55:22'),
(524, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:55:52'),
(525, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:56:22'),
(526, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:56:52'),
(527, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:57:22'),
(528, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:57:52'),
(529, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:58:21'),
(530, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:58:53'),
(531, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 12:59:22'),
(532, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 13:00:23'),
(533, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 13:01:24'),
(534, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 13:02:08'),
(535, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 13:02:13'),
(536, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 13:02:13'),
(537, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 13:02:44'),
(538, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 13:03:14'),
(539, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 13:03:44'),
(540, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 13:03:44'),
(541, 32, 'Bulk Student Import', 'Imported 0 students, 3 errors', '::1', '2026-02-01 13:03:55'),
(542, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:03:55'),
(543, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:04:14'),
(544, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:04:44'),
(545, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:05:14'),
(546, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:05:31'),
(547, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:05:31'),
(548, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:06:01'),
(549, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:06:32'),
(550, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:07:02'),
(551, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:07:32'),
(552, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:08:02'),
(553, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:08:35'),
(554, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:09:37'),
(555, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:09:55'),
(556, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:09:55'),
(557, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:09:56'),
(558, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:09:56'),
(559, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:10:26'),
(560, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:11:06'),
(561, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:11:27'),
(562, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:11:57'),
(563, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:12:27'),
(564, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:12:57'),
(565, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:13:27'),
(566, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:13:57'),
(567, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:14:27'),
(568, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:15:02'),
(569, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:15:27'),
(570, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:15:57'),
(571, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:16:06'),
(572, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:16:06'),
(573, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:16:23'),
(574, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:16:23'),
(575, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:16:53'),
(576, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:17:31'),
(577, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:17:31'),
(578, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:18:02'),
(579, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:18:32'),
(580, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:18:43'),
(581, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:18:43'),
(582, 32, 'Login', NULL, '::1', '2026-02-01 13:19:23'),
(583, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:19:23'),
(584, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:19:23'),
(585, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:19:25'),
(586, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:19:25'),
(587, 32, 'Deactivate User', 'Deactivated user ID: 33', '::1', '2026-02-01 13:19:41'),
(588, 32, 'Deactivate User', 'Deactivated user ID: 34', '::1', '2026-02-01 13:19:46'),
(589, 32, 'Deactivate User', 'Deactivated user ID: 35', '::1', '2026-02-01 13:19:54'),
(590, 32, 'Activate User', 'Activated user ID: 35', '::1', '2026-02-01 13:19:54'),
(591, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:19:55'),
(592, 32, 'Deactivate User', 'Deactivated user ID: 35', '::1', '2026-02-01 13:19:55'),
(593, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:20:25'),
(594, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:20:55'),
(595, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:21:27'),
(596, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:21:55'),
(597, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:22:25'),
(598, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:22:55'),
(599, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:23:29'),
(600, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:24:29'),
(601, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:25:29'),
(602, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:26:29'),
(603, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:27:29'),
(604, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:28:05'),
(605, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:28:25'),
(606, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:28:55'),
(607, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:29:25'),
(608, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:30:26'),
(609, 32, 'Created User Account', 'Created student account: 136883100330 (Hannah   Lorainne)', '::1', '2026-02-01 13:30:53'),
(610, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 13:30:55'),
(611, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:31:25'),
(612, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:31:55'),
(613, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:32:25'),
(614, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:33:26'),
(615, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:34:27'),
(616, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:35:28'),
(617, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:36:29'),
(618, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:37:29'),
(619, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:38:10'),
(620, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:38:13'),
(621, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:38:13'),
(622, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:38:44'),
(623, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:39:14'),
(624, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:39:44'),
(625, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:40:17'),
(626, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:40:44'),
(627, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:41:14'),
(628, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:41:59'),
(629, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:42:14'),
(630, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:42:44'),
(631, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:43:29'),
(632, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:44:29'),
(633, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:45:29'),
(634, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:46:30'),
(635, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:47:29'),
(636, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:48:29'),
(637, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:49:34'),
(638, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:50:29'),
(639, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:51:29'),
(640, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:52:29'),
(641, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:53:29'),
(642, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:54:29'),
(643, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:55:29'),
(644, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:56:29'),
(645, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:57:29'),
(646, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:58:29'),
(647, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 13:59:29'),
(648, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 14:00:29'),
(649, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 14:01:29'),
(650, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 14:02:29'),
(651, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 14:03:29'),
(652, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 14:04:29'),
(653, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 14:05:14'),
(654, 32, 'Deactivate User', 'Deactivated user ID: 36', '::1', '2026-02-01 14:05:20'),
(655, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 14:05:44'),
(656, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:06:00'),
(657, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:06:00'),
(658, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:06:32'),
(659, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:07:00'),
(661, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:07:27'),
(662, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:07:27'),
(663, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:07:57'),
(665, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:08:27'),
(666, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:09:06'),
(667, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:09:27'),
(668, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:09:57'),
(669, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:10:30'),
(670, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:10:58'),
(671, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:11:09'),
(672, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:11:10'),
(673, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:11:38'),
(674, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:12:08'),
(676, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:12:38'),
(677, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:13:08'),
(678, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:13:40'),
(679, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:14:08'),
(680, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:15:30'),
(681, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:16:17'),
(682, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:16:21'),
(683, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:16:22'),
(684, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:16:51'),
(685, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 14:17:21'),
(686, 32, 'Created User Account', 'Created student account: 136883100330 (Hannah   Lorainne)', '::1', '2026-02-01 14:17:35'),
(687, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:17:40'),
(688, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:17:54'),
(689, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:18:22'),
(690, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:18:51'),
(691, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:19:21'),
(692, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:19:51'),
(693, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:20:25'),
(694, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:20:52'),
(695, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:21:29'),
(696, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:22:29'),
(697, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:23:34'),
(698, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:24:29'),
(699, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:25:29'),
(700, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:26:29'),
(701, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:27:29'),
(702, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:28:29'),
(703, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:29:29'),
(704, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:30:29'),
(705, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:31:29'),
(706, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:32:29'),
(707, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:33:29'),
(708, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:34:29'),
(709, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:35:30'),
(710, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:36:29'),
(711, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:37:29'),
(712, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:38:29'),
(713, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:39:29'),
(714, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:40:29'),
(715, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:41:29'),
(716, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:42:29'),
(717, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:43:29'),
(718, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:44:29'),
(719, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:45:29'),
(720, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:46:29'),
(721, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:47:29'),
(722, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:48:29'),
(723, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:49:30'),
(724, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:50:29'),
(725, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:51:36'),
(726, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:52:29'),
(727, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:53:29'),
(728, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:54:29'),
(729, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:55:29'),
(730, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:56:29'),
(731, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:57:29'),
(732, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:58:29'),
(733, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 14:59:29'),
(734, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:00:29'),
(735, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:01:29'),
(736, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:02:29'),
(737, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:03:29'),
(738, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:04:29'),
(739, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:05:29'),
(740, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:06:29'),
(741, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:07:32'),
(742, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:08:29'),
(743, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:09:29'),
(744, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:10:29'),
(745, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:11:29'),
(746, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:12:29'),
(747, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:13:29'),
(748, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:14:29'),
(749, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:15:29'),
(750, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:16:29'),
(751, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:17:29'),
(752, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:18:29'),
(753, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:19:29'),
(754, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:20:37'),
(755, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:21:29'),
(756, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:22:29'),
(757, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:23:41'),
(758, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:24:29'),
(759, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:25:29'),
(760, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:26:29'),
(761, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:27:29'),
(762, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:28:30'),
(763, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:29:29'),
(764, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:30:31'),
(765, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:31:29'),
(766, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:32:29'),
(767, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:33:29'),
(768, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:34:30'),
(769, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:35:29'),
(770, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:36:29'),
(771, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:37:29'),
(772, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:38:29'),
(773, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:39:29'),
(774, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:40:29'),
(775, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:41:29'),
(776, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:42:29'),
(777, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:43:29'),
(778, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:44:29'),
(779, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:45:39'),
(780, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:46:29'),
(781, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:47:29'),
(782, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:48:29'),
(783, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:49:07'),
(784, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:49:24'),
(785, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:49:54'),
(786, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:50:29'),
(787, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:51:30'),
(788, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:52:29'),
(789, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:53:29'),
(790, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:54:29'),
(791, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:55:29'),
(792, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:56:29'),
(793, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:57:29'),
(794, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:58:29'),
(795, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 15:59:29'),
(796, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:00:29'),
(797, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:01:29'),
(798, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:02:29'),
(799, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:02:55'),
(800, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:03:00'),
(801, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:03:00'),
(802, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:03:31'),
(803, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:04:01'),
(804, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:04:31'),
(805, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:05:01'),
(806, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:05:31'),
(807, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:06:01'),
(808, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:06:31'),
(809, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:07:01'),
(810, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:07:31'),
(811, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:08:29'),
(812, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:09:29'),
(813, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:10:29'),
(814, 40, 'Login', NULL, '::1', '2026-02-01 16:23:01'),
(815, 40, 'Password Changed', 'User changed password (forced change)', '::1', '2026-02-01 16:23:17'),
(816, 40, 'Update Physical Info', 'Updated physical information (height, weight, BMI, blood type)', '::1', '2026-02-01 16:23:35'),
(817, 40, 'Update Allergies', 'Updated allergies list - 1 allergies saved', '::1', '2026-02-01 16:23:48'),
(818, 32, 'Login', NULL, '::1', '2026-02-01 16:44:40'),
(819, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 16:44:40'),
(820, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 16:44:41'),
(821, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 16:44:44'),
(822, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 16:44:45'),
(823, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 16:45:15'),
(824, 32, 'Created User Account', 'Created student account: 136883100330 (Hannah Lorainne  Genandoy)', '::1', '2026-02-01 16:45:41'),
(825, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:45:44'),
(826, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:45:45'),
(827, 32, 'Login', NULL, '::1', '2026-02-01 16:52:41'),
(828, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:52:41'),
(829, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:52:41'),
(830, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:52:45'),
(831, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:52:45'),
(832, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:53:16'),
(833, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:53:46'),
(834, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:54:16'),
(835, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:54:46'),
(836, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:55:16'),
(837, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:55:46'),
(838, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:56:29'),
(839, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:57:00'),
(840, 32, 'Login', NULL, '::1', '2026-02-01 16:57:25'),
(841, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:57:26'),
(842, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 16:57:26'),
(843, 41, 'Login', NULL, '::1', '2026-02-01 16:58:05'),
(844, 41, 'Password Changed', 'User changed password (forced change)', '::1', '2026-02-01 17:01:05'),
(845, 41, 'Update Physical Info', 'Updated physical information (height, weight, BMI, blood type)', '::1', '2026-02-01 17:01:40'),
(846, 41, 'Update Allergies', 'Updated allergies list - 1 allergies saved', '::1', '2026-02-01 17:01:50'),
(847, 32, 'Login', NULL, '::1', '2026-02-01 17:06:54'),
(848, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 17:06:54'),
(849, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 17:06:54'),
(850, 32, 'Login', NULL, '::1', '2026-02-01 17:10:39'),
(851, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 17:10:40'),
(852, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 17:10:40'),
(853, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 17:10:42'),
(854, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 17:10:42'),
(855, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 17:11:12'),
(856, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 17:11:42'),
(857, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 17:12:12'),
(858, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 17:12:42'),
(859, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 17:13:12'),
(860, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 17:13:42'),
(861, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 17:14:25'),
(862, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 17:15:25'),
(863, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 17:15:50'),
(864, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 17:15:53'),
(865, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 17:15:53'),
(866, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 17:16:23'),
(867, 32, 'Created User Account', 'Created student account: 136883100330 (Hannah Lorainne  Genandoy)', '::1', '2026-02-01 17:16:37'),
(868, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 17:16:40'),
(869, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 17:16:53'),
(870, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 17:17:23'),
(871, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 17:17:53'),
(872, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 17:18:23'),
(873, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 17:18:53'),
(874, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 17:19:23'),
(875, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 17:20:13'),
(876, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 17:20:23'),
(877, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 17:21:11'),
(878, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 17:21:23'),
(879, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 17:21:53'),
(880, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 17:22:23'),
(881, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 17:23:24'),
(882, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 17:24:25'),
(883, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 17:25:25'),
(884, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 17:25:33'),
(885, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 17:25:33'),
(886, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 17:26:03'),
(887, 32, 'Created User Account', 'Created adviser account: 00001 (Gale  Gregory)', '::1', '2026-02-01 17:26:30'),
(888, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 17:26:32'),
(889, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 17:26:33'),
(890, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 17:27:03'),
(891, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 17:27:33'),
(892, 32, 'Created User Account', 'Created student account: 136883100331 (Wallance  Delgado)', '::1', '2026-02-01 17:27:49'),
(893, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:27:51'),
(894, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:28:03'),
(895, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:28:37'),
(896, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:29:03'),
(897, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:30:04'),
(898, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:31:05'),
(899, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:32:07'),
(900, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:33:07'),
(901, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:34:08'),
(902, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:35:09'),
(903, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:36:10'),
(904, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:37:11'),
(905, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:38:12'),
(906, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:39:13'),
(907, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:40:14'),
(908, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:41:15'),
(909, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:42:16'),
(910, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:43:19'),
(911, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:44:19'),
(912, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:45:20'),
(913, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:46:21'),
(914, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:47:26'),
(915, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:48:25'),
(916, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 17:48:41'),
(917, 43, 'Login', NULL, '::1', '2026-02-01 17:48:53'),
(918, 43, 'Password Changed', 'User changed password (forced change)', '::1', '2026-02-01 17:49:06'),
(919, 44, 'Login', NULL, '::1', '2026-02-01 17:49:37'),
(920, 44, 'Password Changed', 'User changed password (forced change)', '::1', '2026-02-01 17:49:44'),
(921, 43, 'Login', NULL, '::1', '2026-02-01 17:54:43'),
(922, 43, 'Update Physical Info', 'Updated physical information (height, weight, BMI, blood type)', '::1', '2026-02-01 17:54:56'),
(923, 43, 'Update Allergies', 'Updated allergies list - 1 allergies saved', '::1', '2026-02-01 17:55:14'),
(924, 43, 'Update Medical History', 'Updated medical history for student ID: 13', '::1', '2026-02-01 17:59:18'),
(925, 44, 'Login', NULL, '::1', '2026-02-01 17:59:50'),
(926, 43, 'Login', NULL, '::1', '2026-02-01 18:04:44'),
(927, 43, 'Update Physical Info', 'Updated physical information (height, weight, BMI, blood type)', '::1', '2026-02-01 18:04:55'),
(928, 43, 'Update Medical History', 'Updated medical history for student ID: 13', '::1', '2026-02-01 18:05:33'),
(929, 43, 'Login', NULL, '::1', '2026-02-01 18:06:14'),
(930, 43, 'Update Physical Info', 'Updated physical information (height, weight, BMI, blood type)', '::1', '2026-02-01 18:06:43'),
(931, 43, 'Update Medical History', 'Updated medical history for student ID: 13', '::1', '2026-02-01 18:07:01'),
(932, 43, 'Update Physical Info', 'Updated physical information (height, weight, BMI, blood type)', '::1', '2026-02-01 18:07:14'),
(933, 44, 'Login', NULL, '::1', '2026-02-01 18:17:43'),
(934, 44, 'View Notifications', 'Viewed adviser notifications - 0 notifications', '::1', '2026-02-01 18:18:03'),
(935, 44, 'View Notifications', 'Viewed adviser notifications - 0 notifications', '::1', '2026-02-01 18:18:03'),
(936, 32, 'Login', NULL, '::1', '2026-02-01 18:18:45'),
(937, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 18:18:46'),
(938, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 18:18:46'),
(939, 45, 'Login', NULL, '::1', '2026-02-01 18:19:18'),
(940, 45, 'Password Changed', 'User changed password (forced change)', '::1', '2026-02-01 18:19:27'),
(941, 45, 'Update Physical Info', 'Updated physical information (height, weight, BMI, blood type)', '::1', '2026-02-01 18:19:57'),
(942, 44, 'Login', NULL, '::1', '2026-02-01 18:24:20'),
(943, 44, 'Student Promotion', 'Graduated 1 student(s)', '::1', '2026-02-01 18:53:41'),
(944, 45, 'Login', NULL, '::1', '2026-02-01 18:53:57'),
(945, 32, 'Login', NULL, '::1', '2026-02-01 18:58:24'),
(946, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 18:58:24'),
(947, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 18:58:24'),
(948, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 18:58:30'),
(949, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 18:58:30'),
(950, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 18:59:00'),
(951, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 18:59:30'),
(952, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:00:00'),
(953, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:00:30'),
(954, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:00:48'),
(955, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:00:49'),
(956, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:01:18'),
(957, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:01:48'),
(958, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:02:19'),
(959, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:02:48'),
(960, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:03:18'),
(961, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:03:48'),
(962, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:04:18'),
(963, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:04:48'),
(964, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:05:19'),
(965, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:05:48'),
(966, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:06:18'),
(967, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:06:48'),
(968, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:07:18'),
(969, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:07:32'),
(970, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:07:32'),
(971, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:08:02'),
(972, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:08:32'),
(973, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:09:02'),
(974, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:09:32'),
(975, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:10:02'),
(976, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:10:32'),
(977, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:11:02'),
(978, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:11:32'),
(979, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:12:02'),
(980, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:12:32'),
(981, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:13:02'),
(982, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:13:32'),
(983, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:14:02'),
(984, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:14:32'),
(985, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:15:02'),
(986, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:15:32'),
(987, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:16:02'),
(988, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:16:32'),
(989, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:17:02'),
(990, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:17:32'),
(991, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:18:02'),
(992, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:18:32'),
(993, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:19:02'),
(994, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:19:32'),
(995, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:20:02'),
(996, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:20:32'),
(997, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:21:02'),
(998, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:21:32'),
(999, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:22:02'),
(1000, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:22:32'),
(1001, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:23:02'),
(1002, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:23:32'),
(1003, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:24:02'),
(1004, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:24:32'),
(1005, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:25:02'),
(1006, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:25:32'),
(1007, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:26:02'),
(1008, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:26:32'),
(1009, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:27:02'),
(1010, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:27:32'),
(1011, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:28:02'),
(1012, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:28:32'),
(1013, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:29:02'),
(1014, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:29:32'),
(1015, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:30:02'),
(1016, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:30:32'),
(1017, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:31:02'),
(1018, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:31:32'),
(1019, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:32:02'),
(1020, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:32:32');
INSERT INTO `activity_logs` (`log_id`, `user_id`, `action`, `details`, `ip_address`, `created_at`) VALUES
(1021, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:33:02'),
(1022, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:33:32'),
(1023, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:34:02'),
(1024, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:34:32'),
(1025, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:35:02'),
(1026, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:35:32'),
(1027, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:36:02'),
(1028, 32, 'Created User Account', 'Created student account: 136883100332 (Clyde  Alonzo)', '::1', '2026-02-01 19:36:28'),
(1029, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 19:36:32'),
(1030, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 19:36:33'),
(1031, 46, 'Login', NULL, '::1', '2026-02-01 19:36:53'),
(1032, 46, 'Password Changed', 'User changed password (forced change)', '::1', '2026-02-01 19:37:05'),
(1033, 32, 'Login', NULL, '::1', '2026-02-01 19:37:30'),
(1034, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 19:37:30'),
(1035, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 19:37:30'),
(1036, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 19:37:36'),
(1037, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 19:37:36'),
(1038, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 19:38:06'),
(1039, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 19:38:36'),
(1040, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 19:39:06'),
(1041, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 19:39:36'),
(1042, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 19:39:49'),
(1043, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 19:39:49'),
(1044, 32, 'Created User Account', 'Created adviser account: 00002 (Diane  Capadosa)', '::1', '2026-02-01 19:40:00'),
(1045, 32, 'View Users', 'Viewed all users - 6 total', '::1', '2026-02-01 19:40:04'),
(1046, 47, 'Login', NULL, '::1', '2026-02-01 19:40:30'),
(1047, 47, 'Password Changed', 'User changed password (forced change)', '::1', '2026-02-01 19:40:41'),
(1048, 47, 'View Notifications', 'Viewed adviser notifications - 0 notifications', '::1', '2026-02-01 19:46:30'),
(1049, 47, 'View Notifications', 'Viewed adviser notifications - 0 notifications', '::1', '2026-02-01 19:46:30'),
(1050, 43, 'Login', NULL, '::1', '2026-02-01 19:47:55'),
(1051, 43, 'Update Physical Info', 'Updated physical information (height, weight, BMI, blood type)', '::1', '2026-02-01 19:48:07'),
(1052, 46, 'Login', NULL, '::1', '2026-02-01 19:48:21'),
(1053, 47, 'Login', NULL, '::1', '2026-02-01 19:48:42'),
(1054, 32, 'Login', NULL, '::1', '2026-02-01 20:08:21'),
(1055, 32, 'View Users', 'Viewed all users - 6 total', '::1', '2026-02-01 20:08:23'),
(1056, 32, 'View Users', 'Viewed all users - 6 total', '::1', '2026-02-01 20:08:23'),
(1057, 32, 'View Users', 'Viewed all users - 6 total', '::1', '2026-02-01 20:08:53'),
(1058, 47, 'Login', NULL, '::1', '2026-02-01 20:09:16'),
(1059, 47, 'Student Promotion', 'Promoted 1 student(s) to Grade 9', '::1', '2026-02-01 20:10:26'),
(1060, 46, 'Login', NULL, '::1', '2026-02-01 20:10:40'),
(1061, 32, 'Login', NULL, '::1', '2026-02-01 20:11:01'),
(1062, 32, 'View Users', 'Viewed all users - 6 total', '::1', '2026-02-01 20:11:01'),
(1063, 32, 'View Users', 'Viewed all users - 6 total', '::1', '2026-02-01 20:11:02'),
(1064, 32, 'View Users', 'Viewed all users - 6 total', '::1', '2026-02-01 20:11:08'),
(1065, 32, 'View Users', 'Viewed all users - 6 total', '::1', '2026-02-01 20:11:08'),
(1066, 32, 'View Users', 'Viewed all users - 6 total', '::1', '2026-02-01 20:11:38'),
(1067, 32, 'Created User Account', 'Created adviser account: 00003 (Airah  Icawat)', '::1', '2026-02-01 20:12:01'),
(1068, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-01 20:12:05'),
(1069, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-01 20:12:08'),
(1070, 48, 'Login', NULL, '::1', '2026-02-01 20:12:24'),
(1071, 48, 'Password Changed', 'User changed password (forced change)', '::1', '2026-02-01 20:12:33'),
(1072, 32, 'Login', NULL, '::1', '2026-02-01 20:36:21'),
(1073, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-01 20:36:22'),
(1074, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-01 20:36:22'),
(1075, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-01 20:36:28'),
(1076, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-01 20:36:28'),
(1077, 48, 'Login', NULL, '::1', '2026-02-01 20:36:47'),
(1078, 46, 'Login', NULL, '::1', '2026-02-01 20:37:10'),
(1079, 46, 'Login', NULL, '::1', '2026-02-01 20:38:06'),
(1080, 48, 'Login', NULL, '::1', '2026-02-01 20:38:19'),
(1081, 32, 'Login', NULL, '::1', '2026-02-01 20:38:52'),
(1082, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-01 20:38:52'),
(1083, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-01 20:38:53'),
(1084, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-01 20:38:54'),
(1085, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-01 20:38:54'),
(1086, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-01 20:39:24'),
(1087, 32, 'Created User Account', 'Created student account: 136883100333 (Wilma  Buron)', '::1', '2026-02-01 20:39:42'),
(1088, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-01 20:39:46'),
(1089, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-01 20:39:54'),
(1090, 49, 'Login', NULL, '::1', '2026-02-01 20:40:05'),
(1091, 49, 'Password Changed', 'User changed password (forced change)', '::1', '2026-02-01 20:40:14'),
(1092, 47, 'Login', NULL, '::1', '2026-02-01 20:41:03'),
(1093, 49, 'Login', NULL, '::1', '2026-02-01 20:41:21'),
(1094, 47, 'Login', NULL, '::1', '2026-02-01 20:41:50'),
(1095, 32, 'Login', NULL, '::1', '2026-02-01 20:48:21'),
(1096, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-01 20:48:21'),
(1097, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-01 20:48:22'),
(1098, 32, 'Login', NULL, '::1', '2026-02-01 20:56:17'),
(1099, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-01 20:56:18'),
(1100, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-01 20:56:18'),
(1101, 48, 'Login', NULL, '::1', '2026-02-01 21:04:00'),
(1102, 46, 'Login', NULL, '::1', '2026-02-01 21:04:54'),
(1103, 48, 'Login', NULL, '::1', '2026-02-01 21:05:22'),
(1104, 49, 'Login', NULL, '::1', '2026-02-01 21:05:41'),
(1105, 47, 'Login', NULL, '::1', '2026-02-01 21:05:57'),
(1106, 47, 'Login', NULL, '::1', '2026-02-01 21:07:35'),
(1107, 46, 'Login', NULL, '::1', '2026-02-01 21:08:25'),
(1108, 48, 'Login', NULL, '::1', '2026-02-01 21:08:48'),
(1109, 32, 'Login', NULL, '::1', '2026-02-01 21:09:12'),
(1110, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-01 21:09:12'),
(1111, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-01 21:09:12'),
(1112, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-01 21:09:14'),
(1113, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-01 21:09:14'),
(1114, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-01 21:09:44'),
(1115, 32, 'Created User Account', 'Created student account: 136883100334 (Jester   Trojillo)', '::1', '2026-02-01 21:10:13'),
(1116, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-01 21:10:14'),
(1117, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:10:18'),
(1118, 48, 'Login', NULL, '::1', '2026-02-01 21:10:48'),
(1119, 32, 'Login', NULL, '::1', '2026-02-01 21:16:28'),
(1120, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:16:28'),
(1121, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:16:28'),
(1122, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:16:38'),
(1123, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:16:39'),
(1124, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:16:40'),
(1125, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:16:40'),
(1126, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:16:42'),
(1127, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:16:42'),
(1128, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:17:12'),
(1129, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:17:42'),
(1130, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:18:12'),
(1131, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:18:42'),
(1132, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:19:12'),
(1133, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:19:17'),
(1134, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:19:17'),
(1135, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:19:47'),
(1136, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:20:17'),
(1137, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:20:34'),
(1138, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:20:34'),
(1139, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:20:37'),
(1140, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:20:37'),
(1141, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:21:02'),
(1142, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:21:02'),
(1143, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:21:16'),
(1144, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:21:16'),
(1145, 32, 'Login', NULL, '::1', '2026-02-01 21:21:32'),
(1146, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:21:32'),
(1147, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:21:32'),
(1148, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:22:02'),
(1149, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:22:32'),
(1150, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:23:02'),
(1151, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:23:32'),
(1152, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:24:02'),
(1153, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:24:32'),
(1154, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:25:02'),
(1155, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:25:32'),
(1156, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:26:02'),
(1157, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:26:33'),
(1158, 32, 'View Users', 'Viewed all users - 9 total', '::1', '2026-02-01 21:26:33'),
(1159, 49, 'Login', NULL, '::1', '2026-02-01 21:27:32'),
(1160, 48, 'Login', NULL, '::1', '2026-02-01 21:28:08'),
(1161, 32, 'Login', NULL, '::1', '2026-02-01 21:30:30'),
(1162, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:30:30'),
(1163, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:30:30'),
(1164, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:30:40'),
(1165, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:30:40'),
(1166, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:31:19'),
(1167, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:31:19'),
(1168, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:31:49'),
(1169, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:32:19'),
(1170, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:32:49'),
(1171, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:33:19'),
(1172, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:33:49'),
(1173, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:34:19'),
(1174, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:35:25'),
(1175, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:36:33'),
(1176, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:37:20'),
(1177, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:37:35'),
(1178, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:37:36'),
(1179, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:38:05'),
(1180, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:40:06'),
(1181, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:40:35'),
(1182, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:41:05'),
(1183, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:41:35'),
(1184, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:42:09'),
(1185, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:42:36'),
(1186, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:43:26'),
(1187, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:43:55'),
(1188, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:44:52'),
(1189, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:44:52'),
(1190, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:48:34'),
(1191, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 21:48:34'),
(1192, 32, 'School Year Created', 'Created school year: 2024-2025 (ID: 8)', '::1', '2026-02-01 22:03:12'),
(1193, 32, 'School Year Created', 'Created school year: 2025-2026 (ID: 9)', '::1', '2026-02-01 22:03:50'),
(1194, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 22:04:04'),
(1195, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 22:04:04'),
(1196, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 22:04:05'),
(1197, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-01 22:04:05'),
(1198, 32, 'Created User Account', 'Created adviser account: 00001 (Gale  Gregory)', '::1', '2026-02-01 22:04:24'),
(1199, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 22:04:29'),
(1200, 53, 'Login', NULL, '::1', '2026-02-01 22:05:19'),
(1201, 53, 'Password Changed', 'User changed password (forced change)', '::1', '2026-02-01 22:05:26'),
(1202, 32, 'Login', NULL, '::1', '2026-02-01 22:05:54'),
(1203, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 22:05:54'),
(1204, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 22:05:54'),
(1205, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 22:05:56'),
(1206, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 22:05:56'),
(1207, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-01 22:06:26'),
(1208, 32, 'Created User Account', 'Created student account: 136883100330 (Hannah   Lorainne)', '::1', '2026-02-01 22:06:29'),
(1209, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 22:06:34'),
(1210, 54, 'Login', NULL, '::1', '2026-02-01 22:06:51'),
(1211, 54, 'Password Changed', 'User changed password (forced change)', '::1', '2026-02-01 22:06:59'),
(1212, 53, 'Login', NULL, '::1', '2026-02-01 22:07:17'),
(1213, 54, 'Login', NULL, '::1', '2026-02-01 22:07:27'),
(1214, 54, 'Update Physical Info', 'Updated physical information (height, weight, BMI, blood type)', '::1', '2026-02-01 22:07:39'),
(1215, 54, 'Update Allergies', 'Updated allergies list - 1 allergies saved', '::1', '2026-02-01 22:07:54'),
(1216, 32, 'Login', NULL, '::1', '2026-02-01 22:09:05'),
(1217, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 22:09:05'),
(1218, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 22:09:05'),
(1219, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 22:09:07'),
(1220, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 22:09:07'),
(1221, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-01 22:09:37'),
(1222, 32, 'Created User Account', 'Created adviser account: 00002 (Diane  Capadosa)', '::1', '2026-02-01 22:09:59'),
(1223, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 22:10:03'),
(1224, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 22:10:07'),
(1225, 55, 'Login', NULL, '::1', '2026-02-01 22:10:20'),
(1226, 55, 'Password Changed', 'User changed password (forced change)', '::1', '2026-02-01 22:10:27'),
(1227, 32, 'Login', NULL, '::1', '2026-02-01 22:10:43'),
(1228, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 22:10:44'),
(1229, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 22:10:44'),
(1230, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 22:10:57'),
(1231, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 22:10:57'),
(1232, 32, 'View Users', 'Viewed all users - 4 total', '::1', '2026-02-01 22:11:27'),
(1233, 32, 'Created User Account', 'Created student account: 136883100331 (Clyde   Alonzo)', '::1', '2026-02-01 22:11:35'),
(1234, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 22:11:40'),
(1235, 56, 'Login', NULL, '::1', '2026-02-01 22:11:59'),
(1236, 56, 'Password Changed', 'User changed password (forced change)', '::1', '2026-02-01 22:12:07'),
(1237, 56, 'Update Physical Info', 'Updated physical information (height, weight, BMI, blood type)', '::1', '2026-02-01 22:12:23'),
(1238, 32, 'Login', NULL, '::1', '2026-02-01 22:12:39'),
(1239, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 22:12:40'),
(1240, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 22:12:40'),
(1241, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 22:12:58'),
(1242, 32, 'View Users', 'Viewed all users - 5 total', '::1', '2026-02-01 22:12:58'),
(1243, 32, 'Created User Account', 'Created adviser account: 00003 (Airah   Icawat)', '::1', '2026-02-01 22:13:23'),
(1244, 32, 'View Users', 'Viewed all users - 6 total', '::1', '2026-02-01 22:13:27'),
(1245, 32, 'View Users', 'Viewed all users - 6 total', '::1', '2026-02-01 22:13:29'),
(1246, 57, 'Login', NULL, '::1', '2026-02-01 22:13:44'),
(1247, 57, 'Password Changed', 'User changed password (forced change)', '::1', '2026-02-01 22:13:50'),
(1248, 55, 'Login', NULL, '::1', '2026-02-01 22:14:05'),
(1249, 32, 'Login', NULL, '::1', '2026-02-01 22:16:59'),
(1250, 32, 'View Users', 'Viewed all users - 6 total', '::1', '2026-02-01 22:17:00'),
(1251, 32, 'View Users', 'Viewed all users - 6 total', '::1', '2026-02-01 22:17:00'),
(1252, 32, 'School Year Created', 'Created school year: 2026-2027 (ID: 10)', '::1', '2026-02-01 22:17:44'),
(1253, 32, 'Section Created', 'Created section: Daffodils for Grade Level ID: 2, School Year ID: 9', '::1', '2026-02-01 22:26:53'),
(1254, 55, 'Login', NULL, '::1', '2026-02-01 22:27:08'),
(1255, 55, 'View Notifications', 'Viewed adviser notifications - 0 notifications', '::1', '2026-02-01 22:27:14'),
(1256, 55, 'View Notifications', 'Viewed adviser notifications - 0 notifications', '::1', '2026-02-01 22:27:14'),
(1257, 32, 'Login', NULL, '::1', '2026-02-01 22:38:05'),
(1258, 32, 'View Users', 'Viewed all users - 6 total', '::1', '2026-02-01 22:38:06'),
(1259, 32, 'View Users', 'Viewed all users - 6 total', '::1', '2026-02-01 22:38:06'),
(1260, 32, 'Section Created', 'Created section: Bonifacio for Grade Level ID: 3, School Year ID: 10', '::1', '2026-02-01 22:38:23'),
(1261, 55, 'Login', NULL, '::1', '2026-02-01 22:38:36'),
(1262, 55, 'Student Promotion', 'Promoted 1 student(s) to Grade 9', '::1', '2026-02-01 22:38:47'),
(1263, 56, 'Login', NULL, '::1', '2026-02-01 22:39:05'),
(1264, 57, 'Login', NULL, '::1', '2026-02-01 22:44:01'),
(1265, 56, 'Login', NULL, '::1', '2026-02-01 22:52:59'),
(1266, 57, 'Login', NULL, '::1', '2026-02-01 22:54:21'),
(1267, 55, 'Login', NULL, '::1', '2026-02-01 22:54:43'),
(1268, 56, 'Login', NULL, '::1', '2026-02-01 22:54:53'),
(1269, 54, 'Login', NULL, '::1', '2026-02-02 10:13:41'),
(1270, 32, 'Login', NULL, '::1', '2026-02-02 10:14:17'),
(1271, 32, 'View Users', 'Viewed all users - 6 total', '::1', '2026-02-02 10:14:17'),
(1272, 32, 'View Users', 'Viewed all users - 6 total', '::1', '2026-02-02 10:14:17'),
(1273, 32, 'View Users', 'Viewed all users - 6 total', '::1', '2026-02-02 10:14:23'),
(1274, 32, 'View Users', 'Viewed all users - 6 total', '::1', '2026-02-02 10:14:23'),
(1275, 32, 'View Users', 'Viewed all users - 6 total', '::1', '2026-02-02 10:14:53'),
(1276, 32, 'Created User Account', 'Created clinic_staff account: STAFF-001 (Lulubelle Gabasa)', '::1', '2026-02-02 10:15:03'),
(1277, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:15:08'),
(1278, 58, 'Login', NULL, '::1', '2026-02-02 10:15:35'),
(1279, 58, 'Password Changed', 'User changed password (forced change)', '::1', '2026-02-02 10:15:42'),
(1280, 32, 'Login', NULL, '::1', '2026-02-02 10:17:19'),
(1281, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:17:19'),
(1282, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:17:19'),
(1283, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:17:22'),
(1284, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:17:22'),
(1285, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:17:26'),
(1286, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:17:26'),
(1287, 32, 'Login', NULL, '::1', '2026-02-02 10:20:18'),
(1288, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:20:18'),
(1289, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:20:18'),
(1290, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:20:20'),
(1291, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:20:20'),
(1292, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:20:50'),
(1293, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:21:20'),
(1294, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:21:50'),
(1295, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:22:20'),
(1296, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:22:50'),
(1297, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:23:20'),
(1298, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:23:50'),
(1299, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:24:20'),
(1300, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:24:50'),
(1301, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:25:20'),
(1302, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:25:50'),
(1303, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:26:20'),
(1304, 54, 'Login', NULL, '::1', '2026-02-02 10:26:41'),
(1305, 58, 'Login', NULL, '::1', '2026-02-02 10:35:57'),
(1306, 56, 'Login', NULL, '::1', '2026-02-02 10:49:25'),
(1307, 56, 'Update Physical Info', 'Updated physical information (height, weight, BMI, blood type)', '::1', '2026-02-02 10:50:04'),
(1308, 58, 'Login', NULL, '::1', '2026-02-02 10:50:23'),
(1309, 32, 'Login', NULL, '::1', '2026-02-02 10:51:31'),
(1310, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:51:31'),
(1311, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:51:31'),
(1312, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:51:37'),
(1313, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:51:37'),
(1314, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:51:59'),
(1315, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:51:59'),
(1316, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:52:00'),
(1317, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:52:00'),
(1318, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:52:10'),
(1319, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:52:10'),
(1320, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:52:41'),
(1321, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:53:11'),
(1322, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:53:41'),
(1323, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:54:11'),
(1324, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:54:41'),
(1325, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:55:11'),
(1326, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:56:24'),
(1327, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:57:24'),
(1328, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:58:25'),
(1329, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 10:59:24'),
(1330, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:00:26'),
(1331, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:01:24'),
(1332, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:02:24'),
(1333, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:03:24'),
(1334, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:04:35'),
(1335, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:05:19'),
(1336, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:05:27'),
(1337, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:05:27'),
(1338, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:08:27'),
(1339, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:09:04'),
(1340, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:09:04'),
(1341, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:09:07'),
(1342, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:09:07'),
(1343, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:09:38'),
(1344, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:10:08'),
(1345, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:10:38'),
(1346, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:11:08'),
(1347, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:11:38'),
(1348, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:12:07'),
(1349, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:12:41'),
(1350, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:13:08'),
(1351, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:13:31'),
(1352, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:13:31'),
(1353, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:14:02'),
(1354, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:14:19'),
(1355, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:14:19'),
(1356, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:14:50'),
(1357, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:15:20'),
(1358, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:15:50'),
(1359, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:16:20'),
(1360, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:16:50'),
(1361, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:17:20'),
(1362, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:18:21'),
(1363, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:18:49'),
(1364, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 11:19:20'),
(1365, 32, 'Login', NULL, '::1', '2026-02-02 14:12:40'),
(1366, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:12:41'),
(1367, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:12:41'),
(1368, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:13:11'),
(1369, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:13:41'),
(1370, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:14:11'),
(1371, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:14:41'),
(1372, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:15:11'),
(1373, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:15:41'),
(1374, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:16:24'),
(1375, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:17:22'),
(1376, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:18:22'),
(1377, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:19:22'),
(1378, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:20:22'),
(1379, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:21:22'),
(1380, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:22:22'),
(1381, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:23:22'),
(1382, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:24:22'),
(1383, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:25:22'),
(1384, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:26:22'),
(1385, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:27:22'),
(1386, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:27:58'),
(1387, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:28:02'),
(1388, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:28:02'),
(1389, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:28:23'),
(1390, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:28:23'),
(1391, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:42:18'),
(1392, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:42:18'),
(1393, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:42:49'),
(1394, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:43:19'),
(1395, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:43:49'),
(1396, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:44:19'),
(1397, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:44:49'),
(1398, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:45:19'),
(1399, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:46:03'),
(1400, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:46:22'),
(1401, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:47:22'),
(1402, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:48:22'),
(1403, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:49:22'),
(1404, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:50:22'),
(1405, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:51:22'),
(1406, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:52:22'),
(1407, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:53:26'),
(1408, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:54:22'),
(1409, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:55:22'),
(1410, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:55:49'),
(1411, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:56:31'),
(1412, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:57:22'),
(1413, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:58:22'),
(1414, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:59:22'),
(1415, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:59:38'),
(1416, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 14:59:38'),
(1417, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:00:02'),
(1418, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:00:02'),
(1419, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:00:34'),
(1420, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:01:03'),
(1421, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:01:33'),
(1422, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:02:03'),
(1423, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:02:33'),
(1424, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:03:02'),
(1425, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:03:33'),
(1426, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:04:03'),
(1427, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:04:33'),
(1428, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:05:03'),
(1429, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:05:33'),
(1430, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:06:03'),
(1431, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:06:33'),
(1432, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:07:03'),
(1433, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:07:35'),
(1434, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:08:03'),
(1435, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:09:04'),
(1436, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:09:22'),
(1437, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:09:23'),
(1438, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:09:53'),
(1439, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:10:23'),
(1440, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:10:52'),
(1441, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:11:22'),
(1442, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:11:52'),
(1443, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:12:22'),
(1444, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:12:52'),
(1445, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:13:22'),
(1446, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:13:52'),
(1447, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:14:22'),
(1448, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:14:52'),
(1449, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:15:23'),
(1450, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:15:52'),
(1451, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:16:22'),
(1452, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:16:52'),
(1453, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:17:22'),
(1454, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:17:52'),
(1455, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:18:22'),
(1456, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:18:52'),
(1457, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:19:22'),
(1458, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:19:52'),
(1459, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:20:22'),
(1460, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:20:52'),
(1461, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:21:22'),
(1462, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:21:52'),
(1463, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:22:22'),
(1464, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:22:52'),
(1465, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:23:22'),
(1466, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:23:52'),
(1467, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:24:23'),
(1468, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:24:53'),
(1469, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:25:23'),
(1470, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:25:53'),
(1471, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:26:25'),
(1472, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:27:22'),
(1473, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:28:33'),
(1474, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:29:24'),
(1475, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:30:26'),
(1476, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:31:27'),
(1477, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:32:22'),
(1478, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:33:22'),
(1479, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-02 15:33:52'),
(1480, 54, 'Login', NULL, '::1', '2026-02-02 15:38:55'),
(1481, 32, 'Login', NULL, '::1', '2026-02-04 16:09:49'),
(1482, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:09:50'),
(1483, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:09:50'),
(1484, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:10:20'),
(1485, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:10:50'),
(1486, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:11:20'),
(1487, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:11:50'),
(1488, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:12:20'),
(1489, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:12:50'),
(1490, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:13:20'),
(1491, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:14:06'),
(1492, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:14:20'),
(1493, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:14:50'),
(1494, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:15:20'),
(1495, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:16:20'),
(1496, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:17:20'),
(1497, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:18:20'),
(1498, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:19:20'),
(1499, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:20:20'),
(1500, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:21:20'),
(1501, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:22:20'),
(1502, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:23:20'),
(1503, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:24:20'),
(1504, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:25:20'),
(1505, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:26:20'),
(1506, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:27:20'),
(1507, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:28:20'),
(1508, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:29:20'),
(1509, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:30:20'),
(1510, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:31:20'),
(1511, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:32:20'),
(1512, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:33:20'),
(1513, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:34:20'),
(1514, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:35:20'),
(1515, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:36:20'),
(1516, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:37:20'),
(1517, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:38:20'),
(1518, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:39:20'),
(1519, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:40:20'),
(1520, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:41:20'),
(1521, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:42:20'),
(1522, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:43:20'),
(1523, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:44:20'),
(1524, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:45:20'),
(1525, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:46:20'),
(1526, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:47:20'),
(1527, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:48:20'),
(1528, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:49:20'),
(1529, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:50:20'),
(1530, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:51:20'),
(1531, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:52:20'),
(1532, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:53:20'),
(1533, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:54:20'),
(1534, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:55:20'),
(1535, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:56:20'),
(1536, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:57:20'),
(1537, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:58:20'),
(1538, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 16:59:20'),
(1539, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:00:20'),
(1540, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:01:20'),
(1541, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:02:20'),
(1542, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:03:20'),
(1543, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:04:20'),
(1544, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:05:20'),
(1545, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:06:20'),
(1546, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:07:20'),
(1547, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:08:20'),
(1548, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:09:20'),
(1549, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:10:20'),
(1550, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:11:20'),
(1551, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:12:20'),
(1552, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:13:20'),
(1553, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:14:20'),
(1554, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:15:08'),
(1555, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:15:20'),
(1556, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:15:50'),
(1557, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:16:20'),
(1558, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:17:20'),
(1559, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:18:20'),
(1560, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:19:20'),
(1561, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:20:20'),
(1562, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:21:20'),
(1563, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:22:20'),
(1564, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:23:24'),
(1565, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:23:35'),
(1566, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:23:35'),
(1567, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:24:03'),
(1568, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:24:33'),
(1569, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:24:50'),
(1570, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:24:50'),
(1571, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:25:20'),
(1572, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:25:50'),
(1573, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:26:20'),
(1574, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:26:41'),
(1575, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:26:41'),
(1576, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:27:12'),
(1577, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:27:42'),
(1578, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:28:12'),
(1579, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:28:42'),
(1580, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:29:12'),
(1581, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:29:42'),
(1582, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:30:20'),
(1583, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:31:20'),
(1584, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 17:32:18'),
(1585, 53, 'Login', NULL, '::1', '2026-02-04 17:33:11'),
(1586, 53, 'View Notifications', 'Viewed adviser notifications - 1 notifications', '::1', '2026-02-04 17:49:41'),
(1587, 53, 'View Notifications', 'Viewed adviser notifications - 1 notifications', '::1', '2026-02-04 17:49:41'),
(1588, 57, 'Login', NULL, '::1', '2026-02-04 18:03:27'),
(1589, 57, 'View Notifications', 'Viewed adviser notifications - 1 notifications', '::1', '2026-02-04 18:03:38'),
(1590, 57, 'View Notifications', 'Viewed adviser notifications - 1 notifications', '::1', '2026-02-04 18:03:38'),
(1591, 54, 'Login', NULL, '::1', '2026-02-04 18:04:03'),
(1592, 54, 'Update Physical Info', 'Updated physical information (height, weight, BMI, blood type)', '::1', '2026-02-04 18:04:26'),
(1593, 54, 'Login', NULL, '::1', '2026-02-04 18:04:39'),
(1594, 32, 'Login', NULL, '::1', '2026-02-04 18:04:59'),
(1595, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 18:04:59'),
(1596, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 18:04:59'),
(1597, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 18:05:05'),
(1598, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-04 18:05:05'),
(1599, 54, 'Login', NULL, '::1', '2026-02-05 07:49:01'),
(1600, 54, 'Login', NULL, '::1', '2026-02-05 07:50:45'),
(1601, 56, 'Login', NULL, '::1', '2026-02-05 07:51:19'),
(1602, 56, 'Update Allergies', 'Updated allergies list - 1 allergies saved', '::1', '2026-02-05 07:51:45'),
(1603, 53, 'Login', NULL, '::1', '2026-02-05 07:52:15'),
(1604, 55, 'Login', NULL, '::1', '2026-02-05 07:52:27'),
(1605, 57, 'Login', NULL, '::1', '2026-02-05 07:52:41'),
(1606, 57, 'View Notifications', 'Viewed adviser notifications - 1 notifications', '::1', '2026-02-05 07:52:50'),
(1607, 57, 'View Notifications', 'Viewed adviser notifications - 1 notifications', '::1', '2026-02-05 07:52:50'),
(1608, 57, 'View Notifications', 'Viewed adviser notifications - 1 notifications', '::1', '2026-02-05 07:53:11'),
(1609, 57, 'View Notifications', 'Viewed adviser notifications - 1 notifications', '::1', '2026-02-05 07:53:11'),
(1610, 32, 'Login', NULL, '::1', '2026-02-05 07:53:30'),
(1611, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-05 07:53:31'),
(1612, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-05 07:53:31'),
(1613, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-05 07:53:40'),
(1614, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-05 07:53:40'),
(1615, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-05 07:54:28'),
(1616, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-05 07:54:28'),
(1617, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-05 07:54:58'),
(1618, 32, 'View Users', 'Viewed all users - 7 total', '::1', '2026-02-05 07:55:28'),
(1619, 32, 'Created User Account', 'Created student account: 136883100332 (Clarence  Villas)', '::1', '2026-02-05 07:55:35'),
(1620, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 07:55:40'),
(1621, 59, 'Login', NULL, '::1', '2026-02-05 07:56:10'),
(1622, 59, 'Password Changed', 'User changed password (forced change)', '::1', '2026-02-05 07:56:17'),
(1623, 57, 'Login', NULL, '::1', '2026-02-05 07:57:02'),
(1624, 59, 'Login', NULL, '::1', '2026-02-05 07:57:14'),
(1625, 32, 'Login', NULL, '::1', '2026-02-05 07:57:34'),
(1626, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 07:57:35'),
(1627, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 07:57:35');
INSERT INTO `activity_logs` (`log_id`, `user_id`, `action`, `details`, `ip_address`, `created_at`) VALUES
(1628, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 07:57:38'),
(1629, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 07:57:38'),
(1630, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 07:58:30'),
(1631, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 07:58:30'),
(1632, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 07:58:31'),
(1633, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 07:58:31'),
(1634, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 07:59:01'),
(1635, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 07:59:31'),
(1636, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 08:00:01'),
(1637, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 08:00:31'),
(1638, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 08:01:01'),
(1639, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 08:01:31'),
(1640, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 08:02:01'),
(1641, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 08:02:31'),
(1642, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 08:03:01'),
(1643, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 08:03:31'),
(1644, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 08:04:01'),
(1645, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 08:04:32'),
(1646, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 08:05:02'),
(1647, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 08:06:03'),
(1648, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 08:07:04'),
(1649, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 08:07:31'),
(1650, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 08:08:01'),
(1651, 32, 'View Users', 'Viewed all users - 8 total', '::1', '2026-02-05 08:08:32'),
(1652, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-05 08:09:02'),
(1653, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-05 08:09:26'),
(1654, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-05 08:09:26'),
(1655, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-05 08:09:57'),
(1656, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-05 08:10:27'),
(1657, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-05 08:10:57'),
(1658, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-05 08:11:27'),
(1659, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-05 08:11:57'),
(1660, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-05 08:12:27'),
(1661, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-05 08:13:18'),
(1662, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-05 08:14:18'),
(1663, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-05 08:15:18'),
(1664, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-05 08:16:04'),
(1665, 32, 'School Year Created', 'Created school year: 2026-2027 (ID: 11)', '::1', '2026-02-05 08:18:59'),
(1666, 32, 'Section Created', 'Created section: Mapagmahal for Grade Level ID: 1, School Year ID: 11', '::1', '2026-02-05 08:19:23'),
(1667, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-05 08:19:31'),
(1668, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-05 08:19:31'),
(1669, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-05 08:20:01'),
(1670, 32, 'View Users', 'Viewed all users - 1 total', '::1', '2026-02-05 08:20:31'),
(1671, 32, 'Created User Account', 'Created adviser account: 2026-01 (Heart   Igot)', '::1', '2026-02-05 08:20:38'),
(1672, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-05 08:20:42'),
(1673, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-05 08:21:02'),
(1674, 60, 'Login', NULL, '::1', '2026-02-05 08:21:37'),
(1675, 60, 'Password Changed', 'User changed password (forced change)', '::1', '2026-02-05 08:21:43'),
(1676, 32, 'Login', NULL, '::1', '2026-02-05 08:22:08'),
(1677, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-05 08:22:08'),
(1678, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-05 08:22:08'),
(1679, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-05 08:22:10'),
(1680, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-05 08:22:10'),
(1681, 32, 'View Users', 'Viewed all users - 2 total', '::1', '2026-02-05 08:22:40'),
(1682, 32, 'Created User Account', 'Created student account: 136663100330 (Wallance  Delgado)', '::1', '2026-02-05 08:22:46'),
(1683, 32, 'View Users', 'Viewed all users - 3 total', '::1', '2026-02-05 08:22:50'),
(1684, 61, 'Login', NULL, '::1', '2026-02-05 08:23:35'),
(1685, 61, 'Password Changed', 'User changed password (forced change)', '::1', '2026-02-05 08:23:46');

-- --------------------------------------------------------

--
-- Table structure for table `advisers`
--

CREATE TABLE `advisers` (
  `adviser_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `first_name` varchar(80) DEFAULT NULL,
  `last_name` varchar(80) DEFAULT NULL,
  `employee_number` varchar(50) DEFAULT NULL,
  `contact_phone` varchar(30) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` datetime DEFAULT NULL,
  `grade_level` varchar(10) DEFAULT NULL,
  `section` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `advisers`
--

INSERT INTO `advisers` (`adviser_id`, `user_id`, `first_name`, `last_name`, `employee_number`, `contact_phone`, `created_at`, `is_active`, `deleted_at`, `grade_level`, `section`) VALUES
(12, 60, 'Heart ', 'Igot', '2026-01', '09123456789', '2026-02-05 08:20:38', 1, NULL, '7', '1');

-- --------------------------------------------------------

--
-- Table structure for table `adviser_assignments`
--

CREATE TABLE `adviser_assignments` (
  `id` int(11) NOT NULL,
  `adviser_id` int(10) UNSIGNED NOT NULL,
  `section_id` int(11) NOT NULL,
  `school_year_id` int(11) NOT NULL,
  `assigned_date` datetime DEFAULT current_timestamp(),
  `unassigned_date` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `assigned_by_admin_id` int(10) UNSIGNED DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `allergies`
--

CREATE TABLE `allergies` (
  `allergy_id` int(10) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `allergy_text` varchar(255) DEFAULT NULL,
  `severity` enum('Mild','Moderate','Severe') DEFAULT 'Moderate',
  `recorded_at` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `clinic_staff`
--

CREATE TABLE `clinic_staff` (
  `clinic_staff_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `staff_code` varchar(50) DEFAULT NULL,
  `position` varchar(80) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `diagnoses`
--

CREATE TABLE `diagnoses` (
  `diagnosis_id` bigint(20) UNSIGNED NOT NULL,
  `visit_id` bigint(20) UNSIGNED NOT NULL,
  `icd_code` varchar(20) DEFAULT NULL,
  `diagnosis_text` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `email_logs`
--

CREATE TABLE `email_logs` (
  `log_id` bigint(20) UNSIGNED NOT NULL,
  `recipient` varchar(255) NOT NULL,
  `subject` varchar(500) NOT NULL,
  `priority` enum('high','normal','low') DEFAULT 'normal',
  `status` enum('sending','sent','failed') DEFAULT 'sending',
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `sent_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `email_logs`
--

INSERT INTO `email_logs` (`log_id`, `recipient`, `subject`, `priority`, `status`, `error_message`, `created_at`, `sent_at`) VALUES
(29, 'h.igot@gmail.com', 'Your PDMHS Medical System Account', 'normal', 'sent', NULL, '2026-02-05 08:20:38', '2026-02-05 08:20:42'),
(30, 'wallance@gmail.com', 'Your PDMHS Medical System Account', 'normal', 'sent', NULL, '2026-02-05 08:22:46', '2026-02-05 08:22:50');

-- --------------------------------------------------------

--
-- Table structure for table `grade_levels`
--

CREATE TABLE `grade_levels` (
  `id` int(11) NOT NULL,
  `level_number` int(11) NOT NULL COMMENT '7, 8, 9, 10, 11, 12',
  `level_name` varchar(50) NOT NULL COMMENT 'Grade 7, Grade 8, etc.',
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `grade_levels`
--

INSERT INTO `grade_levels` (`id`, `level_number`, `level_name`, `description`, `created_at`) VALUES
(1, 7, 'Grade 7', 'First Year - Junior High School', '2026-01-15 08:03:58'),
(2, 8, 'Grade 8', 'Second Year - Junior High School', '2026-01-15 08:03:58'),
(3, 9, 'Grade 9', 'Third Year - Junior High School', '2026-01-15 08:03:58'),
(4, 10, 'Grade 10', 'Fourth Year - Junior High School', '2026-01-15 08:03:58'),
(5, 11, 'Grade 11', 'First Year - Senior High School', '2026-01-15 08:03:58'),
(6, 12, 'Grade 12', 'Second Year - Senior High School', '2026-01-15 08:03:58');

-- --------------------------------------------------------

--
-- Table structure for table `medical_history`
--

CREATE TABLE `medical_history` (
  `history_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `allergy_medicine` tinyint(1) DEFAULT 0,
  `allergy_pollens` tinyint(1) DEFAULT 0,
  `allergy_food` tinyint(1) DEFAULT 0,
  `allergy_stinging_insects` tinyint(1) DEFAULT 0,
  `condition_error_refraction` tinyint(1) DEFAULT 0,
  `condition_heart_problem` tinyint(1) DEFAULT 0,
  `condition_bleeding_disorder` tinyint(1) DEFAULT 0,
  `condition_hernia` tinyint(1) DEFAULT 0,
  `condition_asthma` tinyint(1) DEFAULT 0,
  `condition_anemia` tinyint(1) DEFAULT 0,
  `condition_anxiety_depression` tinyint(1) DEFAULT 0,
  `condition_seizure` tinyint(1) DEFAULT 0,
  `surgery_hospitalization` tinyint(1) DEFAULT 0,
  `surgery_details` text DEFAULT NULL,
  `family_tuberculosis` tinyint(1) DEFAULT 0,
  `family_cancer` tinyint(1) DEFAULT 0,
  `family_stroke_cardiac` tinyint(1) DEFAULT 0,
  `family_diabetes` tinyint(1) DEFAULT 0,
  `family_hypertension` tinyint(1) DEFAULT 0,
  `family_depression` tinyint(1) DEFAULT 0,
  `family_thyroid` tinyint(1) DEFAULT 0,
  `family_phobia` tinyint(1) DEFAULT 0,
  `smoke_exposure` tinyint(1) DEFAULT 0,
  `notes` text DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `medical_visits`
--

CREATE TABLE `medical_visits` (
  `visit_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `clinic_staff_id` int(10) UNSIGNED DEFAULT NULL,
  `visit_datetime` datetime NOT NULL,
  `visit_type` enum('Routine','Emergency','Follow-up','Referral') DEFAULT 'Routine',
  `chief_complaint` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('Open','Closed','Referred') DEFAULT 'Open',
  `notify_parent` tinyint(1) DEFAULT 0 COMMENT 'Whether to notify parent/guardian',
  `parent_notified_at` datetime DEFAULT NULL COMMENT 'When parent was notified',
  `notification_method` enum('sms','email','call','none') DEFAULT 'none' COMMENT 'Method used to notify parent',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` bigint(20) UNSIGNED NOT NULL,
  `parent_id` int(10) UNSIGNED DEFAULT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `student_id` int(10) UNSIGNED DEFAULT NULL,
  `visit_id` bigint(20) UNSIGNED DEFAULT NULL,
  `channel` enum('SMS','Email','System') DEFAULT 'SMS',
  `message` text DEFAULT NULL,
  `status` enum('Pending','Sent','Failed') DEFAULT 'Pending',
  `priority` enum('normal','urgent') DEFAULT 'normal',
  `provider_id` varchar(100) DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `parents`
--

CREATE TABLE `parents` (
  `parent_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `first_name` varchar(80) NOT NULL,
  `last_name` varchar(80) NOT NULL,
  `relation` varchar(50) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `promotion_batch_logs`
--

CREATE TABLE `promotion_batch_logs` (
  `id` int(11) NOT NULL,
  `batch_name` varchar(100) NOT NULL,
  `current_school_year_id` int(11) NOT NULL,
  `target_school_year_id` int(11) NOT NULL,
  `total_students` int(11) DEFAULT 0,
  `promoted_count` int(11) DEFAULT 0,
  `graduated_count` int(11) DEFAULT 0,
  `repeated_count` int(11) DEFAULT 0,
  `transferred_count` int(11) DEFAULT 0,
  `dropped_count` int(11) DEFAULT 0,
  `failed_count` int(11) DEFAULT 0,
  `status` enum('pending','in_progress','completed','failed','rolled_back') DEFAULT 'pending',
  `executed_by_admin_id` int(10) UNSIGNED NOT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `promotion_rules`
--

CREATE TABLE `promotion_rules` (
  `id` int(11) NOT NULL,
  `school_year_id` int(11) NOT NULL,
  `from_grade_level_id` int(11) NOT NULL,
  `to_grade_level_id` int(11) DEFAULT NULL,
  `promotion_action` enum('promote','graduate','repeat','transfer') DEFAULT 'promote',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `qr_codes`
--

CREATE TABLE `qr_codes` (
  `qr_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `qr_token` varchar(255) NOT NULL,
  `qr_generated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `qr_expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `qr_codes`
--

INSERT INTO `qr_codes` (`qr_id`, `student_id`, `qr_token`, `qr_generated_at`, `qr_expires_at`) VALUES
(19, 21, 'c297e50c650e25b72f98fce580f6a117', '2026-02-05 08:22:46', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` tinyint(3) UNSIGNED NOT NULL,
  `role_name` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `role_name`) VALUES
(1, 'Admin'),
(3, 'Adviser'),
(4, 'Clinic Staff'),
(5, 'Parent'),
(2, 'Student');

-- --------------------------------------------------------

--
-- Table structure for table `school_years`
--

CREATE TABLE `school_years` (
  `id` int(11) NOT NULL,
  `year_name` varchar(20) NOT NULL COMMENT 'e.g., 2024-2025',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` tinyint(1) DEFAULT 0,
  `is_current` tinyint(1) DEFAULT 0 COMMENT '1 = Current school year, 0 = Not current',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `school_years`
--

INSERT INTO `school_years` (`id`, `year_name`, `start_date`, `end_date`, `is_active`, `is_current`, `created_at`, `updated_at`, `created_by`) VALUES
(11, '2026-2027', '2026-06-07', '2027-03-31', 1, 0, '2026-02-05 08:18:59', '2026-02-05 08:18:59', 32);

-- --------------------------------------------------------

--
-- Table structure for table `sections`
--

CREATE TABLE `sections` (
  `id` int(11) NOT NULL,
  `section_name` varchar(50) NOT NULL COMMENT 'A, B, C, etc.',
  `grade_level_id` int(11) NOT NULL,
  `school_year_id` int(11) NOT NULL,
  `adviser_id` int(10) UNSIGNED DEFAULT NULL,
  `capacity` int(11) DEFAULT 50,
  `current_enrollment` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sections`
--

INSERT INTO `sections` (`id`, `section_name`, `grade_level_id`, `school_year_id`, `adviser_id`, `capacity`, `current_enrollment`, `is_active`, `created_at`, `updated_at`, `created_by`) VALUES
(4, 'STEM 2', 6, 6, 44, 50, 1, 1, '2026-02-01 18:35:00', '2026-02-01 20:33:51', NULL),
(11, 'STEM 1', 5, 7, NULL, 50, 0, 1, '2026-02-01 18:51:34', '2026-02-01 18:51:34', NULL),
(12, 'STEM 2', 5, 7, NULL, 50, 0, 1, '2026-02-01 18:51:34', '2026-02-01 18:51:34', NULL),
(13, 'HUMSS 1', 5, 7, NULL, 50, 0, 1, '2026-02-01 18:51:34', '2026-02-01 18:51:34', NULL),
(14, 'STEM 1', 6, 7, NULL, 50, 0, 1, '2026-02-01 18:51:34', '2026-02-01 18:51:34', NULL),
(15, 'STEM 2', 6, 7, NULL, 50, 0, 1, '2026-02-01 18:51:34', '2026-02-01 18:51:34', NULL),
(16, 'HUMSS 1', 6, 7, NULL, 50, 0, 1, '2026-02-01 18:51:34', '2026-02-01 18:51:34', NULL),
(17, '1', 1, 6, NULL, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 19:08:38', NULL),
(18, '2', 1, 6, NULL, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 19:08:38', NULL),
(19, '3', 1, 6, NULL, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 19:08:38', NULL),
(20, '1', 2, 6, NULL, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 19:08:38', NULL),
(21, '2', 2, 6, 47, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 19:51:27', NULL),
(22, '3', 2, 6, NULL, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 19:08:38', NULL),
(23, '1', 3, 6, NULL, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 19:08:38', NULL),
(24, '2', 3, 6, NULL, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 19:08:38', NULL),
(25, '3', 3, 6, 48, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 20:12:01', NULL),
(26, '1', 4, 6, NULL, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 19:08:38', NULL),
(27, '2', 4, 6, NULL, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 19:08:38', NULL),
(28, '3', 4, 6, NULL, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 19:08:38', NULL),
(29, '1', 1, 7, NULL, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 19:08:38', NULL),
(30, '2', 1, 7, NULL, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 19:08:38', NULL),
(31, '3', 1, 7, NULL, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 19:08:38', NULL),
(32, '1', 2, 7, NULL, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 19:08:38', NULL),
(33, '2', 2, 7, 47, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 19:55:48', NULL),
(34, '3', 2, 7, NULL, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 19:08:38', NULL),
(35, '1', 3, 7, NULL, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 19:08:38', NULL),
(36, '2', 3, 7, NULL, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 19:08:38', NULL),
(37, '3', 3, 7, NULL, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 19:08:38', NULL),
(38, '1', 4, 7, NULL, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 19:08:38', NULL),
(39, '2', 4, 7, NULL, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 19:08:38', NULL),
(40, '3', 4, 7, NULL, 50, 0, 1, '2026-02-01 19:08:38', '2026-02-01 19:08:38', NULL),
(41, 'STEM 1', 5, 6, NULL, 50, 0, 1, '2026-02-01 19:10:15', '2026-02-01 19:10:15', NULL),
(42, 'STEM 2', 5, 6, NULL, 50, 0, 1, '2026-02-01 19:10:15', '2026-02-01 19:10:15', NULL),
(43, 'ABM 1', 5, 6, NULL, 50, 0, 1, '2026-02-01 19:10:15', '2026-02-01 19:10:15', NULL),
(44, 'ABM 2', 5, 6, NULL, 50, 0, 1, '2026-02-01 19:10:15', '2026-02-01 19:10:15', NULL),
(45, 'HUMSS 1', 5, 6, NULL, 50, 0, 1, '2026-02-01 19:10:15', '2026-02-01 19:10:15', NULL),
(46, 'HUMSS 2', 5, 6, NULL, 50, 0, 1, '2026-02-01 19:10:15', '2026-02-01 19:10:15', NULL),
(47, 'TVL-HE 1', 5, 6, NULL, 50, 0, 1, '2026-02-01 19:10:15', '2026-02-01 19:10:15', NULL),
(48, 'TVL-HE 2', 5, 6, NULL, 50, 0, 1, '2026-02-01 19:10:15', '2026-02-01 19:10:15', NULL),
(49, 'TVL-EIM 1', 5, 6, NULL, 50, 0, 1, '2026-02-01 19:10:15', '2026-02-01 19:10:15', NULL),
(50, 'TVL-EIM 2', 5, 6, NULL, 50, 0, 1, '2026-02-01 19:10:15', '2026-02-01 19:10:15', NULL),
(51, 'STEM 1', 6, 6, NULL, 50, 0, 1, '2026-02-01 19:10:15', '2026-02-01 19:10:15', NULL),
(52, 'ABM 1', 6, 6, NULL, 50, 0, 1, '2026-02-01 19:10:15', '2026-02-01 19:10:15', NULL),
(53, 'ABM 2', 6, 6, NULL, 50, 0, 1, '2026-02-01 19:10:15', '2026-02-01 19:10:15', NULL),
(54, 'HUMSS 1', 6, 6, NULL, 50, 0, 1, '2026-02-01 19:10:15', '2026-02-01 19:10:15', NULL),
(55, 'HUMSS 2', 6, 6, NULL, 50, 0, 1, '2026-02-01 19:10:15', '2026-02-01 19:10:15', NULL),
(56, 'TVL-HE 1', 6, 6, NULL, 50, 0, 1, '2026-02-01 19:10:15', '2026-02-01 19:10:15', NULL),
(57, 'TVL-HE 2', 6, 6, NULL, 50, 0, 1, '2026-02-01 19:10:15', '2026-02-01 19:10:15', NULL),
(58, 'TVL-EIM 1', 6, 6, NULL, 50, 0, 1, '2026-02-01 19:10:15', '2026-02-01 19:10:15', NULL),
(59, 'TVL-EIM 2', 6, 6, NULL, 50, 0, 1, '2026-02-01 19:10:15', '2026-02-01 19:10:15', NULL),
(60, 'Daffodils', 2, 9, 55, 50, 0, 1, '2026-02-01 22:26:53', '2026-02-01 22:35:58', 32),
(61, 'Bonifacio', 3, 10, 53, 50, 0, 1, '2026-02-01 22:38:23', '2026-02-01 22:44:36', 32),
(62, '2', 3, 9, 57, 40, 0, 1, '2026-02-01 22:52:17', '2026-02-01 22:52:17', NULL),
(63, 'Mapagmahal', 1, 11, 60, 50, 0, 1, '2026-02-05 08:19:23', '2026-02-05 08:21:10', 32);

-- --------------------------------------------------------

--
-- Table structure for table `sms_logs`
--

CREATE TABLE `sms_logs` (
  `sms_id` bigint(20) UNSIGNED NOT NULL,
  `visit_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Related medical visit',
  `student_id` int(10) UNSIGNED NOT NULL COMMENT 'Student being notified about',
  `recipient_name` varchar(150) DEFAULT NULL COMMENT 'Parent/Guardian name',
  `phone_number` varchar(20) NOT NULL COMMENT 'Recipient phone number',
  `message_type` enum('emergency','routine','general') DEFAULT 'general' COMMENT 'Type of notification',
  `message_content` text NOT NULL COMMENT 'SMS message content',
  `status` enum('pending','sent','delivered','failed') DEFAULT 'pending' COMMENT 'Delivery status',
  `sent_at` datetime DEFAULT NULL COMMENT 'When SMS was sent',
  `delivered_at` datetime DEFAULT NULL COMMENT 'When SMS was delivered',
  `error_message` text DEFAULT NULL COMMENT 'Error details if failed',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tracks SMS notifications sent to parents/guardians';

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `student_id` int(10) UNSIGNED NOT NULL,
  `current_grade_level_id` int(11) DEFAULT NULL,
  `current_section_id` int(11) DEFAULT NULL,
  `current_adviser_id` int(10) UNSIGNED DEFAULT NULL,
  `current_school_year_id` int(11) DEFAULT NULL,
  `enrollment_status` enum('active','promoted','graduated','transferred','dropped','inactive') DEFAULT 'active',
  `promotion_date` datetime DEFAULT NULL,
  `last_promotion_date` datetime DEFAULT NULL,
  `student_number` varchar(30) NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `first_name` varchar(80) NOT NULL,
  `middle_name` varchar(80) DEFAULT NULL,
  `last_name` varchar(80) NOT NULL,
  `birth_date` date DEFAULT NULL,
  `gender` enum('M','F','Other') DEFAULT 'Other',
  `grade_level` varchar(20) DEFAULT NULL,
  `section` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `blood_type` varchar(5) DEFAULT NULL,
  `emergency_contact` varchar(150) DEFAULT NULL,
  `emergency_contact_relation` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` datetime DEFAULT NULL,
  `height_cm` decimal(5,2) DEFAULT NULL COMMENT 'Height in centimeters',
  `weight_kg` decimal(5,2) DEFAULT NULL COMMENT 'Weight in kilograms',
  `bmi` decimal(4,2) DEFAULT NULL COMMENT 'Body Mass Index',
  `bmi_category` varchar(20) DEFAULT NULL COMMENT 'BMI Category (Underweight, Normal, Overweight, Obese)',
  `last_physical_update` timestamp NULL DEFAULT NULL COMMENT 'Last time physical info was updated'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`student_id`, `current_grade_level_id`, `current_section_id`, `current_adviser_id`, `current_school_year_id`, `enrollment_status`, `promotion_date`, `last_promotion_date`, `student_number`, `user_id`, `first_name`, `middle_name`, `last_name`, `birth_date`, `gender`, `grade_level`, `section`, `address`, `blood_type`, `emergency_contact`, `emergency_contact_relation`, `created_at`, `is_active`, `deleted_at`, `height_cm`, `weight_kg`, `bmi`, `bmi_category`, `last_physical_update`) VALUES
(21, NULL, NULL, NULL, NULL, 'active', NULL, NULL, '136663100330', 61, 'Wallance', '', 'Delgado', '2005-04-07', 'M', '7', '1', NULL, NULL, NULL, NULL, '2026-02-05 08:22:46', 1, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `student_adviser`
--

CREATE TABLE `student_adviser` (
  `student_id` int(10) UNSIGNED NOT NULL,
  `adviser_id` int(10) UNSIGNED NOT NULL,
  `assigned_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_parent`
--

CREATE TABLE `student_parent` (
  `student_id` int(10) UNSIGNED NOT NULL,
  `parent_id` int(10) UNSIGNED NOT NULL,
  `relationship_note` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student_promotions`
--

CREATE TABLE `student_promotions` (
  `id` int(11) NOT NULL,
  `student_id` int(10) UNSIGNED NOT NULL,
  `previous_grade_level_id` int(11) DEFAULT NULL,
  `previous_section_id` int(11) DEFAULT NULL,
  `previous_adviser_id` int(10) UNSIGNED DEFAULT NULL,
  `new_grade_level_id` int(11) DEFAULT NULL,
  `new_section_id` int(11) DEFAULT NULL,
  `new_adviser_id` int(10) UNSIGNED DEFAULT NULL,
  `school_year_id` int(11) NOT NULL,
  `promoted_by_admin_id` int(10) UNSIGNED NOT NULL,
  `promotion_date` datetime DEFAULT current_timestamp(),
  `promotion_type` enum('promotion','repeat_grade','transfer','dropout','graduation','manual_adjustment') DEFAULT 'promotion',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `role_id` tinyint(3) UNSIGNED NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `password_must_change` tinyint(1) DEFAULT 0 COMMENT 'Force password change on next login',
  `password_changed_at` datetime DEFAULT NULL COMMENT 'Last password change timestamp',
  `created_by_admin_id` int(10) UNSIGNED DEFAULT NULL COMMENT 'Admin who created this account',
  `temp_password` varchar(50) DEFAULT NULL COMMENT 'Temporary password for email (cleared after first login)',
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `full_name` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `deleted_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `role_id`, `username`, `password_hash`, `password_must_change`, `password_changed_at`, `created_by_admin_id`, `temp_password`, `email`, `phone`, `full_name`, `created_at`, `is_active`, `deleted_at`) VALUES
(32, 1, 'admin', '$2y$10$VRKSez9gbIAB7fyx695fPeaHPg8Qo.VmabPGUBrRWquZYLV5Epd6W', 0, NULL, NULL, NULL, 'admin@pdmhs.edu.ph', '09171234567', 'System Administrator', '2026-02-01 11:46:49', 1, NULL),
(60, 3, '2026-01', '$2y$10$skFaVbGjh5qnOttJel3Ep.H4199W8nhpAtdmJC5SJx7EHMDZSOOtu', 0, '2026-02-05 16:21:43', 32, NULL, 'h.igot@gmail.com', '09123456789', 'Heart   Igot', '2026-02-05 08:20:38', 1, NULL),
(61, 2, '136663100330', '$2y$10$Fp1gdjZi415fqhtatwRn..Zda38iIqLtbYgfbGLRkti8tVYjzMT/C', 0, '2026-02-05 16:23:46', 32, NULL, 'wallance@gmail.com', '09987654532', 'Wallance  Delgado', '2026-02-05 08:22:46', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `vitals`
--

CREATE TABLE `vitals` (
  `vitals_id` bigint(20) UNSIGNED NOT NULL,
  `visit_id` bigint(20) UNSIGNED NOT NULL,
  `recorded_at` datetime DEFAULT current_timestamp(),
  `weight_kg` decimal(5,2) DEFAULT NULL,
  `height_cm` decimal(5,2) DEFAULT NULL,
  `temperature_c` decimal(4,2) DEFAULT NULL,
  `bp_systolic` smallint(6) DEFAULT NULL,
  `bp_diastolic` smallint(6) DEFAULT NULL,
  `pulse_rate` smallint(6) DEFAULT NULL,
  `respiration_rate` smallint(6) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `bmi` decimal(5,2) GENERATED ALWAYS AS (case when `height_cm` > 0 and `weight_kg` > 0 then round(`weight_kg` / (`height_cm` / 100 * (`height_cm` / 100)),2) else NULL end) STORED,
  `bmi_category` varchar(20) GENERATED ALWAYS AS (case when `height_cm` > 0 and `weight_kg` > 0 then case when round(`weight_kg` / (`height_cm` / 100 * (`height_cm` / 100)),2) < 18.5 then _utf8mb4'Underweight' when round(`weight_kg` / (`height_cm` / 100 * (`height_cm` / 100)),2) between 18.5 and 24.9 then _utf8mb4'Normal' when round(`weight_kg` / (`height_cm` / 100 * (`height_cm` / 100)),2) between 25.0 and 29.9 then _utf8mb4'Overweight' when round(`weight_kg` / (`height_cm` / 100 * (`height_cm` / 100)),2) >= 30.0 then _utf8mb4'Obese' else NULL end else NULL end) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vitals`
--

INSERT INTO `vitals` (`vitals_id`, `visit_id`, `recorded_at`, `weight_kg`, `height_cm`, `temperature_c`, `bp_systolic`, `bp_diastolic`, `pulse_rate`, `respiration_rate`, `notes`) VALUES
(0, 13, '2026-01-16 11:55:00', NULL, NULL, 40.00, 120, 90, 75, NULL, NULL),
(0, 14, '2026-02-02 10:15:00', NULL, NULL, 38.00, 120, 90, 75, NULL, NULL),
(0, 15, '2026-02-02 10:50:00', NULL, NULL, 37.00, 120, 80, 72, NULL, NULL);

-- --------------------------------------------------------

--
-- Stand-in structure for view `vw_student_medical_profile`
-- (See below for the actual view)
--
CREATE TABLE `vw_student_medical_profile` (
`student_id` int(10) unsigned
,`student_number` varchar(30)
,`full_name` varchar(242)
,`first_name` varchar(80)
,`middle_name` varchar(80)
,`last_name` varchar(80)
,`birth_date` date
,`gender` enum('M','F','Other')
,`grade_level` varchar(20)
,`section` varchar(50)
,`height_cm` decimal(5,2)
,`weight_kg` decimal(5,2)
,`bmi` decimal(4,2)
,`bmi_category` varchar(20)
,`address` text
,`blood_type` varchar(5)
,`emergency_contact` varchar(150)
,`emergency_contact_relation` varchar(50)
,`adviser_name` varchar(161)
,`email` varchar(150)
,`phone` varchar(30)
,`total_visits` bigint(21)
,`allergy_count` bigint(21)
,`last_visit_date` datetime
);

-- --------------------------------------------------------

--
-- Structure for view `vw_student_medical_profile`
--
DROP TABLE IF EXISTS `vw_student_medical_profile`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_student_medical_profile`  AS SELECT `s`.`student_id` AS `student_id`, `s`.`student_number` AS `student_number`, concat(`s`.`first_name`,' ',ifnull(concat(`s`.`middle_name`,' '),''),`s`.`last_name`) AS `full_name`, `s`.`first_name` AS `first_name`, `s`.`middle_name` AS `middle_name`, `s`.`last_name` AS `last_name`, `s`.`birth_date` AS `birth_date`, `s`.`gender` AS `gender`, `s`.`grade_level` AS `grade_level`, `s`.`section` AS `section`, `s`.`height_cm` AS `height_cm`, `s`.`weight_kg` AS `weight_kg`, `s`.`bmi` AS `bmi`, `s`.`bmi_category` AS `bmi_category`, `s`.`address` AS `address`, `s`.`blood_type` AS `blood_type`, `s`.`emergency_contact` AS `emergency_contact`, `s`.`emergency_contact_relation` AS `emergency_contact_relation`, concat(`a`.`first_name`,' ',`a`.`last_name`) AS `adviser_name`, `u`.`email` AS `email`, `u`.`phone` AS `phone`, count(distinct `mv`.`visit_id`) AS `total_visits`, count(distinct `al`.`allergy_id`) AS `allergy_count`, max(`mv`.`visit_datetime`) AS `last_visit_date` FROM ((((`students` `s` left join `users` `u` on(`s`.`user_id` = `u`.`user_id`)) left join `advisers` `a` on(`s`.`current_adviser_id` = `a`.`adviser_id`)) left join `medical_visits` `mv` on(`s`.`student_id` = `mv`.`student_id`)) left join `allergies` `al` on(`s`.`student_id` = `al`.`student_id`)) WHERE `s`.`is_active` = 1 GROUP BY `s`.`student_id`, `s`.`student_number`, `s`.`first_name`, `s`.`middle_name`, `s`.`last_name`, `s`.`birth_date`, `s`.`gender`, `s`.`grade_level`, `s`.`section`, `s`.`height_cm`, `s`.`weight_kg`, `s`.`bmi`, `s`.`bmi_category`, `s`.`address`, `s`.`blood_type`, `s`.`emergency_contact`, `s`.`emergency_contact_relation`, `a`.`first_name`, `a`.`last_name`, `u`.`email`, `u`.`phone` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `fk_log_user` (`user_id`);

--
-- Indexes for table `advisers`
--
ALTER TABLE `advisers`
  ADD PRIMARY KEY (`adviser_id`),
  ADD UNIQUE KEY `employee_number` (`employee_number`),
  ADD KEY `fk_advisers_user` (`user_id`);

--
-- Indexes for table `adviser_assignments`
--
ALTER TABLE `adviser_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_adviser_section_year` (`adviser_id`,`section_id`,`school_year_id`),
  ADD KEY `idx_adviser` (`adviser_id`),
  ADD KEY `idx_section` (`section_id`),
  ADD KEY `idx_school_year` (`school_year_id`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_assigned_date` (`assigned_date`),
  ADD KEY `assigned_by_admin_id` (`assigned_by_admin_id`);

--
-- Indexes for table `allergies`
--
ALTER TABLE `allergies`
  ADD PRIMARY KEY (`allergy_id`),
  ADD KEY `fk_allergy_student` (`student_id`);

--
-- Indexes for table `clinic_staff`
--
ALTER TABLE `clinic_staff`
  ADD PRIMARY KEY (`clinic_staff_id`),
  ADD UNIQUE KEY `staff_code` (`staff_code`),
  ADD KEY `fk_clinic_user` (`user_id`);

--
-- Indexes for table `diagnoses`
--
ALTER TABLE `diagnoses`
  ADD PRIMARY KEY (`diagnosis_id`),
  ADD KEY `fk_diag_visit` (`visit_id`);

--
-- Indexes for table `email_logs`
--
ALTER TABLE `email_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_recipient` (`recipient`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `grade_levels`
--
ALTER TABLE `grade_levels`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `level_number` (`level_number`),
  ADD KEY `idx_level_number` (`level_number`);

--
-- Indexes for table `medical_history`
--
ALTER TABLE `medical_history`
  ADD PRIMARY KEY (`history_id`),
  ADD KEY `idx_student_id` (`student_id`);

--
-- Indexes for table `medical_visits`
--
ALTER TABLE `medical_visits`
  ADD PRIMARY KEY (`visit_id`),
  ADD KEY `fk_visit_staff` (`clinic_staff_id`),
  ADD KEY `idx_visit_student_datetime` (`student_id`,`visit_datetime`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `fk_notif_parent` (`parent_id`),
  ADD KEY `fk_notif_student` (`student_id`),
  ADD KEY `fk_notif_visit` (`visit_id`),
  ADD KEY `idx_notifications_status_sentat` (`status`,`sent_at`),
  ADD KEY `fk_notif_user` (`user_id`);

--
-- Indexes for table `parents`
--
ALTER TABLE `parents`
  ADD PRIMARY KEY (`parent_id`),
  ADD KEY `fk_parents_user` (`user_id`);

--
-- Indexes for table `promotion_batch_logs`
--
ALTER TABLE `promotion_batch_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `current_school_year_id` (`current_school_year_id`),
  ADD KEY `target_school_year_id` (`target_school_year_id`),
  ADD KEY `executed_by_admin_id` (`executed_by_admin_id`);

--
-- Indexes for table `promotion_rules`
--
ALTER TABLE `promotion_rules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_rule` (`school_year_id`,`from_grade_level_id`),
  ADD KEY `idx_school_year` (`school_year_id`),
  ADD KEY `idx_from_grade` (`from_grade_level_id`),
  ADD KEY `to_grade_level_id` (`to_grade_level_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `qr_codes`
--
ALTER TABLE `qr_codes`
  ADD PRIMARY KEY (`qr_id`),
  ADD UNIQUE KEY `student_id` (`student_id`),
  ADD UNIQUE KEY `qr_token` (`qr_token`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Indexes for table `school_years`
--
ALTER TABLE `school_years`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `year_name` (`year_name`),
  ADD KEY `idx_year_name` (`year_name`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `sections`
--
ALTER TABLE `sections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_section_per_year` (`section_name`,`grade_level_id`,`school_year_id`),
  ADD KEY `idx_grade_level` (`grade_level_id`),
  ADD KEY `idx_school_year` (`school_year_id`),
  ADD KEY `idx_adviser` (`adviser_id`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `sms_logs`
--
ALTER TABLE `sms_logs`
  ADD PRIMARY KEY (`sms_id`),
  ADD KEY `idx_visit` (`visit_id`),
  ADD KEY `idx_student` (`student_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_sent_at` (`sent_at`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`student_id`),
  ADD UNIQUE KEY `student_number` (`student_number`),
  ADD KEY `fk_students_user` (`user_id`),
  ADD KEY `idx_current_grade_level` (`current_grade_level_id`),
  ADD KEY `idx_current_section` (`current_section_id`),
  ADD KEY `idx_current_adviser` (`current_adviser_id`),
  ADD KEY `idx_current_school_year` (`current_school_year_id`),
  ADD KEY `idx_enrollment_status` (`enrollment_status`),
  ADD KEY `idx_students_physical` (`height_cm`,`weight_kg`,`bmi`);

--
-- Indexes for table `student_adviser`
--
ALTER TABLE `student_adviser`
  ADD PRIMARY KEY (`student_id`,`adviser_id`),
  ADD KEY `fk_sa_adviser` (`adviser_id`);

--
-- Indexes for table `student_parent`
--
ALTER TABLE `student_parent`
  ADD PRIMARY KEY (`student_id`,`parent_id`),
  ADD KEY `fk_sp_parent` (`parent_id`);

--
-- Indexes for table `student_promotions`
--
ALTER TABLE `student_promotions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_student` (`student_id`),
  ADD KEY `idx_school_year` (`school_year_id`),
  ADD KEY `idx_promotion_date` (`promotion_date`),
  ADD KEY `idx_promotion_type` (`promotion_type`),
  ADD KEY `previous_grade_level_id` (`previous_grade_level_id`),
  ADD KEY `previous_section_id` (`previous_section_id`),
  ADD KEY `previous_adviser_id` (`previous_adviser_id`),
  ADD KEY `new_grade_level_id` (`new_grade_level_id`),
  ADD KEY `new_section_id` (`new_section_id`),
  ADD KEY `new_adviser_id` (`new_adviser_id`),
  ADD KEY `promoted_by_admin_id` (`promoted_by_admin_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `fk_users_role` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `log_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1686;

--
-- AUTO_INCREMENT for table `advisers`
--
ALTER TABLE `advisers`
  MODIFY `adviser_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `adviser_assignments`
--
ALTER TABLE `adviser_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `allergies`
--
ALTER TABLE `allergies`
  MODIFY `allergy_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `clinic_staff`
--
ALTER TABLE `clinic_staff`
  MODIFY `clinic_staff_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `diagnoses`
--
ALTER TABLE `diagnoses`
  MODIFY `diagnosis_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `email_logs`
--
ALTER TABLE `email_logs`
  MODIFY `log_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `grade_levels`
--
ALTER TABLE `grade_levels`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `medical_history`
--
ALTER TABLE `medical_history`
  MODIFY `history_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `medical_visits`
--
ALTER TABLE `medical_visits`
  MODIFY `visit_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `parents`
--
ALTER TABLE `parents`
  MODIFY `parent_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `promotion_batch_logs`
--
ALTER TABLE `promotion_batch_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `promotion_rules`
--
ALTER TABLE `promotion_rules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `qr_codes`
--
ALTER TABLE `qr_codes`
  MODIFY `qr_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` tinyint(3) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `school_years`
--
ALTER TABLE `school_years`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `sections`
--
ALTER TABLE `sections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT for table `sms_logs`
--
ALTER TABLE `sms_logs`
  MODIFY `sms_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `student_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `student_promotions`
--
ALTER TABLE `student_promotions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `fk_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `advisers`
--
ALTER TABLE `advisers`
  ADD CONSTRAINT `fk_advisers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `adviser_assignments`
--
ALTER TABLE `adviser_assignments`
  ADD CONSTRAINT `adviser_assignments_ibfk_1` FOREIGN KEY (`adviser_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `adviser_assignments_ibfk_2` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `adviser_assignments_ibfk_3` FOREIGN KEY (`school_year_id`) REFERENCES `school_years` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `adviser_assignments_ibfk_4` FOREIGN KEY (`assigned_by_admin_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `allergies`
--
ALTER TABLE `allergies`
  ADD CONSTRAINT `fk_allergy_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `clinic_staff`
--
ALTER TABLE `clinic_staff`
  ADD CONSTRAINT `fk_clinic_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `diagnoses`
--
ALTER TABLE `diagnoses`
  ADD CONSTRAINT `fk_diag_visit` FOREIGN KEY (`visit_id`) REFERENCES `medical_visits` (`visit_id`) ON DELETE CASCADE;

--
-- Constraints for table `medical_history`
--
ALTER TABLE `medical_history`
  ADD CONSTRAINT `fk_medical_history_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `medical_visits`
--
ALTER TABLE `medical_visits`
  ADD CONSTRAINT `fk_visit_staff` FOREIGN KEY (`clinic_staff_id`) REFERENCES `clinic_staff` (`clinic_staff_id`),
  ADD CONSTRAINT `fk_visit_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notif_parent` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`parent_id`),
  ADD CONSTRAINT `fk_notif_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`),
  ADD CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `fk_notif_visit` FOREIGN KEY (`visit_id`) REFERENCES `medical_visits` (`visit_id`);

--
-- Constraints for table `parents`
--
ALTER TABLE `parents`
  ADD CONSTRAINT `fk_parents_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `promotion_batch_logs`
--
ALTER TABLE `promotion_batch_logs`
  ADD CONSTRAINT `promotion_batch_logs_ibfk_1` FOREIGN KEY (`current_school_year_id`) REFERENCES `school_years` (`id`),
  ADD CONSTRAINT `promotion_batch_logs_ibfk_2` FOREIGN KEY (`target_school_year_id`) REFERENCES `school_years` (`id`),
  ADD CONSTRAINT `promotion_batch_logs_ibfk_3` FOREIGN KEY (`executed_by_admin_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `promotion_rules`
--
ALTER TABLE `promotion_rules`
  ADD CONSTRAINT `promotion_rules_ibfk_1` FOREIGN KEY (`school_year_id`) REFERENCES `school_years` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `promotion_rules_ibfk_2` FOREIGN KEY (`from_grade_level_id`) REFERENCES `grade_levels` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `promotion_rules_ibfk_3` FOREIGN KEY (`to_grade_level_id`) REFERENCES `grade_levels` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `promotion_rules_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `qr_codes`
--
ALTER TABLE `qr_codes`
  ADD CONSTRAINT `fk_qr_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `school_years`
--
ALTER TABLE `school_years`
  ADD CONSTRAINT `school_years_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `sections`
--
ALTER TABLE `sections`
  ADD CONSTRAINT `sections_ibfk_1` FOREIGN KEY (`grade_level_id`) REFERENCES `grade_levels` (`id`),
  ADD CONSTRAINT `sections_ibfk_2` FOREIGN KEY (`school_year_id`) REFERENCES `school_years` (`id`),
  ADD CONSTRAINT `sections_ibfk_3` FOREIGN KEY (`adviser_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `sections_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `sms_logs`
--
ALTER TABLE `sms_logs`
  ADD CONSTRAINT `fk_sms_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sms_visit` FOREIGN KEY (`visit_id`) REFERENCES `medical_visits` (`visit_id`) ON DELETE SET NULL;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `fk_students_adviser` FOREIGN KEY (`current_adviser_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_students_grade_level` FOREIGN KEY (`current_grade_level_id`) REFERENCES `grade_levels` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_students_school_year` FOREIGN KEY (`current_school_year_id`) REFERENCES `school_years` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_students_section` FOREIGN KEY (`current_section_id`) REFERENCES `sections` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_students_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `student_adviser`
--
ALTER TABLE `student_adviser`
  ADD CONSTRAINT `fk_sa_adviser` FOREIGN KEY (`adviser_id`) REFERENCES `advisers` (`adviser_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sa_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `student_parent`
--
ALTER TABLE `student_parent`
  ADD CONSTRAINT `fk_sp_parent` FOREIGN KEY (`parent_id`) REFERENCES `parents` (`parent_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_sp_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `student_promotions`
--
ALTER TABLE `student_promotions`
  ADD CONSTRAINT `student_promotions_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_promotions_ibfk_2` FOREIGN KEY (`previous_grade_level_id`) REFERENCES `grade_levels` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `student_promotions_ibfk_3` FOREIGN KEY (`previous_section_id`) REFERENCES `sections` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `student_promotions_ibfk_4` FOREIGN KEY (`previous_adviser_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `student_promotions_ibfk_5` FOREIGN KEY (`new_grade_level_id`) REFERENCES `grade_levels` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `student_promotions_ibfk_6` FOREIGN KEY (`new_section_id`) REFERENCES `sections` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `student_promotions_ibfk_7` FOREIGN KEY (`new_adviser_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `student_promotions_ibfk_8` FOREIGN KEY (`school_year_id`) REFERENCES `school_years` (`id`),
  ADD CONSTRAINT `student_promotions_ibfk_9` FOREIGN KEY (`promoted_by_admin_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
