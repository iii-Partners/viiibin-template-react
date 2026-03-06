/**
 * Configuration types for push notification services (FCM and APNs).
 *
 * These types define the server-side configuration needed to send
 * push notifications. The actual values are typically stored in
 * environment variables or a backend config, not in the client app.
 */

type ApnsEnvironment = 'development' | 'production'

/**
 * Firebase Cloud Messaging (FCM) configuration for Android push notifications.
 */
type FcmConfig = {
  /** FCM sender ID from Firebase Console (Project Settings > Cloud Messaging) */
  senderId: string
  /** FCM server key (legacy) or service account for HTTP v1 API */
  serverKey?: string
  /** Firebase project ID */
  projectId?: string
}

/**
 * Apple Push Notification service (APNs) configuration for iOS push notifications.
 */
type ApnsConfig = {
  /** APNs environment — 'development' for debug builds, 'production' for App Store */
  environment: ApnsEnvironment
  /** APNs key ID from Apple Developer portal */
  keyId?: string
  /** Apple Developer team ID */
  teamId?: string
  /** App bundle identifier (e.g., 'com.example.app') */
  bundleId: string
}

/**
 * Combined push notification configuration for both platforms.
 *
 * Usage:
 * ```ts
 * const pushConfig: PushNotificationConfig = {
 *   fcm: {
 *     senderId: import.meta.env.VITE_FCM_SENDER_ID,
 *     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
 *   },
 *   apns: {
 *     environment: import.meta.env.PROD ? 'production' : 'development',
 *     bundleId: import.meta.env.VITE_IOS_BUNDLE_ID,
 *   },
 * }
 * ```
 */
type PushNotificationConfig = {
  fcm?: FcmConfig
  apns?: ApnsConfig
}

export type { PushNotificationConfig, FcmConfig, ApnsConfig, ApnsEnvironment }
